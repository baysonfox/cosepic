import os
from pathlib import Path

# Base directory of the application
BASE_DIR = Path(__file__).resolve().parent.parent

# Directory to scan for images (Read-Only)
# Default to a 'gallery' folder in the root if not set via env var
ROOT_DIR = Path(os.getenv("GALLERY_ROOT_DIR", BASE_DIR / "gallery"))

# Directory to store generated thumbnails (Read-Write)
CACHE_DIR = Path(os.getenv("GALLERY_CACHE_DIR", BASE_DIR / "cache"))
THUMB_DIR = CACHE_DIR / "thumbnails"

# Database Configuration
DB_URL = os.getenv("DB_URL", f"sqlite://{BASE_DIR}/db.sqlite3")

# Ensure cache directories exist
CACHE_DIR.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

# Application Config
APP_TITLE = "NAS Cosplay Gallery"
VERSION = "0.1.0"
