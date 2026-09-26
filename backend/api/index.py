"""
api/index.py
------------
Serverless entry point for Vercel deployment of Debi-Dorshon FastAPI.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' module can be found
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.main import app

# Vercel ASGI serverless handler
handler = app
