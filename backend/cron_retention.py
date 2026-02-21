#!/usr/bin/env python3
"""
MIRA RETENTION CRON JOB
=======================
Runs daily at 3 AM to clean up old chat sessions.
- Summarizes old conversations
- Compresses warm sessions
- Archives cold sessions
- Deletes very old sessions

Usage:
  python3 /app/backend/cron_retention.py

Add to crontab:
  0 3 * * * /usr/bin/python3 /app/backend/cron_retention.py >> /var/log/mira_retention.log 2>&1
"""

import asyncio
import os
import sys
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, '/app/backend')

async def run_retention_job():
    """Run the retention cleanup job."""
    print(f"\n{'='*60}")
    print(f"MIRA RETENTION JOB - {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*60}\n")
    
    try:
        # Import after path is set
        from motor.motor_asyncio import AsyncIOMotorClient
        from mira_retention import archive_old_sessions
        
        # Connect to MongoDB
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'pet_concierge')
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        print(f"Connected to MongoDB: {db_name}")
        
        # Run retention
        stats = await archive_old_sessions(db)
        
        print(f"\n✅ Retention job completed successfully!")
        print(f"   - Summarized: {stats.get('summarized', 0)}")
        print(f"   - Compressed: {stats.get('compressed', 0)}")
        print(f"   - Archived: {stats.get('archived', 0)}")
        print(f"   - Deleted: {stats.get('deleted', 0)}")
        print(f"   - Kept (important): {stats.get('kept_important', 0)}")
        
        # Close connection
        client.close()
        
        return stats
        
    except Exception as e:
        print(f"\n❌ Retention job failed: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    asyncio.run(run_retention_job())
