"""
scripts/seed_db.py
-------------------
Database Seeding Script for Debi-Dorshon.
Reads `debi_dorshon.json` from `data/processed/` and imports pandal data into MongoDB.

Usage:
    uv run --project backend python scripts/seed_db.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Safe encoding for Windows terminal output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend directory is in sys.path if executed from root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load .env file if available
from dotenv import load_dotenv
env_path = BACKEND_DIR / ".env"
if not env_path.exists():
    env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def seed_data():
    json_path = PROJECT_ROOT / "data" / "processed" / "debi_dorshon.json"

    if not json_path.exists():
        print(f"[x] Error: JSON file not found at '{json_path}'")
        return

    print(f"[i] Reading pandal data from: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        pandals = json.load(f)

    print(f"[i] Loaded {len(pandals)} pandal entries from JSON.")

    print(f"[i] Connecting to MongoDB: {settings.MONGODB_URL}")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    collection = db[settings.PANDAL_COLLECTION_NAME]

    existing_count = await collection.count_documents({})
    if existing_count > 0:
        print(f"[i] Collection '{settings.PANDAL_COLLECTION_NAME}' already contains {existing_count} items.")
        force_seed = os.getenv("FORCE_SEED", "").lower() in ("true", "1", "yes")
        if not force_seed:
            print("[i] Skipping seeding as database is already populated.")
            client.close()
            return
        else:
            await collection.delete_many({})
            print("[i] Cleared existing collection data (FORCE_SEED enabled).")

    if pandals:
        result = await collection.insert_many(pandals)
        print(f"[+] Successfully inserted {len(result.inserted_ids)} pandals into MongoDB!")
        # Create multi-key and transit indexes
        await collection.create_index("nearest_stations.name")
        await collection.create_index("nearest_metro.name")
        print("[+] Created indexes on nearest_stations.name and nearest_metro.name")
    else:
        print("[i] No pandals to insert.")

    client.close()
    print("[+] Database seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed_data())

