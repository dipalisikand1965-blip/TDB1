"""
Source Code Download Routes
Allows admin to download the entire project source code as a ZIP file.
Admin-only access.
"""
import os
import io
import zipfile
import tempfile
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBasicCredentials, HTTPBasic
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin - Source Code"])

# These will be set by the main server
_admin_verify_func = None
_admin_credentials = {}

def set_source_download_admin(verify_func, credentials: dict):
    """Set the admin verification function and credentials"""
    global _admin_verify_func, _admin_credentials
    _admin_verify_func = verify_func
    _admin_credentials = credentials

security = HTTPBasic()

def verify_admin_for_download(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials for source download - extra security check"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Credentials required")
    
    expected_username = _admin_credentials.get("username", "aditya")
    expected_password = _admin_credentials.get("password", "lola4304")
    
    correct_username = secrets.compare_digest(credentials.username, expected_username)
    correct_password = secrets.compare_digest(credentials.password, expected_password)
    
    if not (correct_username and correct_password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    return credentials.username


# Directories and files to EXCLUDE from the zip
EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    '__pycache__',
    '.pytest_cache',
    '.emergent',
    '.next',
    'build',
    'dist',
    '.venv',
    'venv',
    'env',
    '.mypy_cache',
    '.ruff_cache',
    'coverage',
    '.coverage',
    'htmlcov',
    '.tox',
    'eggs',
    '*.egg-info',
    '.eggs',
}

EXCLUDE_FILES = {
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    '*.pyc',
    '*.pyo',
    '*.pyd',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.sock',
    '*.pid',
}

EXCLUDE_EXTENSIONS = {
    '.pyc',
    '.pyo',
    '.pyd',
    '.so',
    '.dll',
    '.dylib',
    '.log',
    '.sock',
    '.pid',
}


def should_exclude(path: str, is_dir: bool = False) -> bool:
    """Check if a path should be excluded from the archive"""
    name = os.path.basename(path)
    
    # Check directory exclusions
    if is_dir:
        if name in EXCLUDE_DIRS:
            return True
        # Check wildcard patterns
        for pattern in EXCLUDE_DIRS:
            if '*' in pattern and name.endswith(pattern.replace('*', '')):
                return True
        return False
    
    # Check file exclusions
    if name in EXCLUDE_FILES:
        return True
    
    # Check wildcard patterns
    for pattern in EXCLUDE_FILES:
        if '*' in pattern:
            ext = pattern.replace('*', '')
            if name.endswith(ext):
                return True
    
    # Check extension exclusions
    ext = os.path.splitext(name)[1].lower()
    if ext in EXCLUDE_EXTENSIONS:
        return True
    
    return False


def create_source_zip() -> io.BytesIO:
    """Create a ZIP archive of the source code"""
    app_dir = "/app"
    
    # Create in-memory zip
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(app_dir):
            # Filter out excluded directories (in-place modification)
            dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), is_dir=True)]
            
            for file in files:
                file_path = os.path.join(root, file)
                
                # Skip excluded files
                if should_exclude(file_path, is_dir=False):
                    continue
                
                # Skip very large files (> 10MB)
                try:
                    if os.path.getsize(file_path) > 10 * 1024 * 1024:
                        continue
                except:
                    continue
                
                # Get relative path for archive
                arcname = os.path.relpath(file_path, app_dir)
                
                try:
                    zipf.write(file_path, f"thedoggycompany/{arcname}")
                except Exception as e:
                    logger.warning(f"Skipping file {file_path}: {e}")
                    continue
    
    zip_buffer.seek(0)
    return zip_buffer


@router.get("/download-source")
async def download_source_code(username: str = Depends(verify_admin_for_download)):
    """
    Download the entire project source code as a ZIP file.
    
    **Admin Only** - Requires valid admin credentials.
    
    Excludes:
    - node_modules, .git, __pycache__
    - .env files (for security)
    - Build artifacts and cache directories
    - Files larger than 10MB
    
    Returns: ZIP file containing the source code
    """
    logger.info(f"Admin '{username}' requested source code download")
    
    try:
        zip_buffer = create_source_zip()
        
        # Get approximate size for logging
        zip_size = zip_buffer.getbuffer().nbytes
        logger.info(f"Source code archive created: {zip_size / 1024 / 1024:.2f} MB")
        
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"thedoggycompany_source_{timestamp}.zip"
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(zip_size)
            }
        )
    except Exception as e:
        logger.error(f"Source code download failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create archive: {str(e)}")


@router.get("/source-info")
async def get_source_info(username: str = Depends(verify_admin_for_download)):
    """
    Get information about the source code (file count, directories, etc.)
    Admin only.
    """
    app_dir = "/app"
    
    file_count = 0
    dir_count = 0
    total_size = 0
    file_types = {}
    
    for root, dirs, files in os.walk(app_dir):
        # Filter excluded directories
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), is_dir=True)]
        dir_count += len(dirs)
        
        for file in files:
            file_path = os.path.join(root, file)
            
            if should_exclude(file_path, is_dir=False):
                continue
            
            try:
                size = os.path.getsize(file_path)
                if size > 10 * 1024 * 1024:  # Skip large files
                    continue
                
                total_size += size
                file_count += 1
                
                ext = os.path.splitext(file)[1].lower() or 'no_ext'
                file_types[ext] = file_types.get(ext, 0) + 1
            except:
                continue
    
    return {
        "file_count": file_count,
        "directory_count": dir_count,
        "total_size_mb": round(total_size / 1024 / 1024, 2),
        "file_types": dict(sorted(file_types.items(), key=lambda x: -x[1])[:20]),
        "excludes": {
            "directories": list(EXCLUDE_DIRS)[:10],
            "files": list(EXCLUDE_FILES)[:10]
        }
    }
