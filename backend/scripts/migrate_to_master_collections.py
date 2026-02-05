#!/usr/bin/env python3
"""
Backend Migration Script: db.products -> db.products_master
============================================================
Safely migrates all backend file references from old db.products 
collection to consolidated db.products_master collection.

This is a critical migration to ensure the entire platform uses the 
single source of truth for product data.
"""

import os
import re
from pathlib import Path

# Files to migrate
BACKEND_DIR = "/app/backend"

# Pattern to match db.products (but not db.products_master)
PRODUCTS_PATTERN = re.compile(r'db\.products(?!_master)\.', re.MULTILINE)
SERVICES_PATTERN = re.compile(r'db\.services(?!_master)\.', re.MULTILINE)

# Files to skip (they may have specific reasons to use old collections)
SKIP_FILES = [
    'consolidate_db.py',  # Original migration script
    'enhance_schema.py',
    'enrich_products.py',
    'enrich_products_ai.py',
    'data_migration.py',  # May need both for comparison
]

def migrate_file(filepath: Path) -> tuple:
    """Migrate a single file's references"""
    if filepath.name in SKIP_FILES:
        return (filepath.name, 0, 0, "skipped")
    
    try:
        content = filepath.read_text()
        original_content = content
        
        # Count matches
        products_matches = len(PRODUCTS_PATTERN.findall(content))
        services_matches = len(SERVICES_PATTERN.findall(content))
        
        if products_matches == 0 and services_matches == 0:
            return (filepath.name, 0, 0, "no_changes")
        
        # Replace db.products. with db.products_master.
        content = PRODUCTS_PATTERN.sub('db.products_master.', content)
        
        # Replace db.services. with db.services_master.
        content = SERVICES_PATTERN.sub('db.services_master.', content)
        
        # Write back
        filepath.write_text(content)
        
        return (filepath.name, products_matches, services_matches, "migrated")
        
    except Exception as e:
        return (filepath.name, 0, 0, f"error: {e}")


def main():
    print("=" * 60)
    print("Backend Migration: db.products -> db.products_master")
    print("=" * 60)
    
    # Find all Python files
    py_files = list(Path(BACKEND_DIR).glob("*.py"))
    
    total_products = 0
    total_services = 0
    migrated_files = []
    
    for filepath in sorted(py_files):
        name, products_count, services_count, status = migrate_file(filepath)
        
        if status == "migrated":
            print(f"  [MIGRATED] {name}: {products_count} products, {services_count} services")
            total_products += products_count
            total_services += services_count
            migrated_files.append(name)
        elif status == "skipped":
            print(f"  [SKIPPED]  {name}")
        elif "error" in status:
            print(f"  [ERROR]    {name}: {status}")
    
    print("\n" + "=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"  Files migrated: {len(migrated_files)}")
    print(f"  db.products refs updated: {total_products}")
    print(f"  db.services refs updated: {total_services}")
    print("\n  Migrated files:")
    for f in migrated_files:
        print(f"    - {f}")


if __name__ == "__main__":
    main()
