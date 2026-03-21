"""
Backfill Canonical Answers Migration Script
============================================
IDEMPOTENT script to migrate existing pet soul answers to canonical field names.

This script:
1. Reads all pets with doggy_soul_answers
2. For each pet, canonicalizes the answers using the alias mapping
3. Updates the pet's doggy_soul_answers with canonical field names
4. Preserves original UI field answers as non-scoring fields
5. Logs all changes for audit

IDEMPOTENT: Safe to run multiple times - only processes pets that haven't been migrated.

Usage:
    python scripts/backfill_canonical_answers.py [--dry-run] [--limit N]
    
Options:
    --dry-run   Show what would be changed without modifying database
    --limit N   Process only N pets (for testing)
"""

import os
import sys
import argparse
from datetime import datetime, timezone
from typing import Dict, Any, List

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from canonical_answers import UI_TO_CANONICAL_MAP, CANONICAL_SCORING_FIELDS, is_empty_value

# Migration marker to track processed pets
MIGRATION_MARKER = "_canonical_migration_v1"


def get_database():
    """Connect to MongoDB."""
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "doggy_company")
    client = MongoClient(mongo_url)
    return client[db_name]


def migrate_pet_answers(old_answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate a pet's doggy_soul_answers to canonical field names.
    
    Returns:
        New answers dict with canonical field names
    """
    if not old_answers:
        return {}
    
    # Skip if already migrated
    if old_answers.get(MIGRATION_MARKER):
        return None
    
    new_answers = {}
    mapping_log = []
    
    # Process each answer
    for field, value in old_answers.items():
        if field.startswith("_"):  # Skip metadata fields
            continue
        if is_empty_value(value):
            continue
            
        # Check if field maps to a canonical scoring field
        if field in UI_TO_CANONICAL_MAP:
            canonical_field = UI_TO_CANONICAL_MAP[field]
            if canonical_field in CANONICAL_SCORING_FIELDS:
                # Only set if not already set (first value wins)
                if canonical_field not in new_answers:
                    new_answers[canonical_field] = value
                    if field != canonical_field:
                        mapping_log.append(f"{field} → {canonical_field}")
        
        # Check if it's already a canonical field
        elif field in CANONICAL_SCORING_FIELDS:
            if field not in new_answers:
                new_answers[field] = value
        
        # Preserve all original fields (for non-scoring context)
        if field not in new_answers:
            new_answers[field] = value
    
    # Add migration marker
    new_answers[MIGRATION_MARKER] = {
        "migrated_at": datetime.now(timezone.utc).isoformat(),
        "original_field_count": len(old_answers),
        "canonical_field_count": len([k for k in new_answers.keys() if k in CANONICAL_SCORING_FIELDS]),
        "mapping_log": mapping_log
    }
    
    return new_answers


def run_migration(dry_run: bool = False, limit: int = None):
    """Run the migration on all pets."""
    db = get_database()
    pets_collection = db["pets"]
    
    # Find pets with doggy_soul_answers that haven't been migrated
    query = {
        "doggy_soul_answers": {"$exists": True, "$ne": {}},
        f"doggy_soul_answers.{MIGRATION_MARKER}": {"$exists": False}
    }
    
    cursor = pets_collection.find(query)
    if limit:
        cursor = cursor.limit(limit)
    
    pets = list(cursor)
    print(f"\n{'='*60}")
    print(f"CANONICAL ANSWERS BACKFILL MIGRATION")
    print(f"{'='*60}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"Pets to process: {len(pets)}")
    print(f"{'='*60}\n")
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for pet in pets:
        pet_id = pet.get("_id")
        pet_name = pet.get("name", "Unknown")
        owner_id = pet.get("owner_id", "Unknown")
        
        try:
            old_answers = pet.get("doggy_soul_answers") or {}
            new_answers = migrate_pet_answers(old_answers)
            
            if new_answers is None:
                print(f"  [SKIP] {pet_name} (ID: {pet_id}) - Already migrated")
                skip_count += 1
                continue
            
            # Calculate what changed
            old_canonical_count = len([k for k in old_answers.keys() if k in CANONICAL_SCORING_FIELDS])
            new_canonical_count = len([k for k in new_answers.keys() if k in CANONICAL_SCORING_FIELDS and k != MIGRATION_MARKER])
            mapping_log = new_answers.get(MIGRATION_MARKER, {}).get("mapping_log", [])
            
            print(f"  [{'WOULD UPDATE' if dry_run else 'UPDATE'}] {pet_name} (ID: {pet_id})")
            print(f"      Owner: {owner_id}")
            print(f"      Canonical fields: {old_canonical_count} → {new_canonical_count}")
            if mapping_log:
                print(f"      Mappings: {', '.join(mapping_log[:5])}" + ("..." if len(mapping_log) > 5 else ""))
            
            if not dry_run:
                # Update the pet's answers
                result = pets_collection.update_one(
                    {"_id": pet_id},
                    {"$set": {"doggy_soul_answers": new_answers}}
                )
                if result.modified_count == 1:
                    success_count += 1
                else:
                    print(f"      [WARNING] Update returned modified_count={result.modified_count}")
                    error_count += 1
            else:
                success_count += 1
                
        except Exception as e:
            print(f"  [ERROR] {pet_name} (ID: {pet_id}) - {str(e)}")
            error_count += 1
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"MIGRATION SUMMARY")
    print(f"{'='*60}")
    print(f"Processed: {success_count}")
    print(f"Skipped (already migrated): {skip_count}")
    print(f"Errors: {error_count}")
    print(f"{'='*60}\n")
    
    return success_count, skip_count, error_count


def verify_migration():
    """Verify the migration was successful."""
    db = get_database()
    pets_collection = db["pets"]
    
    # Count migrated vs not migrated
    migrated = pets_collection.count_documents({
        f"doggy_soul_answers.{MIGRATION_MARKER}": {"$exists": True}
    })
    
    not_migrated = pets_collection.count_documents({
        "doggy_soul_answers": {"$exists": True, "$ne": {}},
        f"doggy_soul_answers.{MIGRATION_MARKER}": {"$exists": False}
    })
    
    print(f"\nMIGRATION STATUS:")
    print(f"  Migrated pets: {migrated}")
    print(f"  Pending pets: {not_migrated}")
    
    return migrated, not_migrated


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill canonical answers for pets")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without modifying database")
    parser.add_argument("--limit", type=int, help="Limit number of pets to process")
    parser.add_argument("--verify", action="store_true", help="Only verify migration status")
    
    args = parser.parse_args()
    
    if args.verify:
        verify_migration()
    else:
        run_migration(dry_run=args.dry_run, limit=args.limit)
        verify_migration()
