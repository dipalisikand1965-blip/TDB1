"""
TIMESTAMP UTILITIES - CONSISTENT DATE FORMATTING
=================================================

All timestamps across the system MUST use these functions to ensure
consistent date formatting that sorts correctly in MongoDB.

PROBLEM SOLVED:
- ISO strings with timezone (+00:00) sorted differently than without
- This caused newest items to appear at bottom of lists
- Different parts of code used different formats

SOLUTION:
- Single function for all timestamp generation
- Consistent format: YYYY-MM-DDTHH:MM:SS.fff+00:00
"""

from datetime import datetime, timezone


def get_utc_timestamp() -> str:
    """
    Get current UTC timestamp in consistent ISO format.
    
    Format: YYYY-MM-DDTHH:MM:SS.fff+00:00
    
    This format:
    - Includes milliseconds for precision
    - Always includes +00:00 timezone
    - Sorts correctly in MongoDB string comparisons
    
    Usage:
        from timestamp_utils import get_utc_timestamp
        
        doc = {
            "created_at": get_utc_timestamp(),
            "updated_at": get_utc_timestamp()
        }
    """
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+00:00'


def parse_timestamp(ts: str) -> datetime:
    """
    Parse a timestamp string to datetime object.
    Handles both formats: with and without timezone.
    """
    from dateutil.parser import parse
    parsed = parse(ts)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def normalize_timestamp(ts: str) -> str:
    """
    Convert any timestamp format to consistent format.
    """
    parsed = parse_timestamp(ts)
    return parsed.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+00:00'


# Aliases for backward compatibility
get_consistent_timestamp = get_utc_timestamp
now_utc = get_utc_timestamp
