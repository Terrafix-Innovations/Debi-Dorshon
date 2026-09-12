---
name: pandal-data-pipeline
description: >-
  Use this skill when modifying, parsing, or seeding pandal location data, debi_dorshon.json, or MongoDB collections.
---

# Pandal Data Pipeline & Seeding

## Files
- Raw Excel: `data/raw/Debi-Dorshon.xlsx`
- Processed JSON: `data/processed/debi_dorshon.json`
- URL & Coords Cache: `data/processed/url_cache.json`
- Seeder: `scripts/seed_db.py`

## Seeding MongoDB
To re-seed MongoDB with force override:
```bash
uv run --project backend python -c "import os, asyncio; os.environ['FORCE_SEED']='true'; from scripts.seed_db import seed_data; asyncio.run(seed_data())"
```
Ensure all pandals have valid, non-null `location.latitude` and `location.longitude` in `data/processed/debi_dorshon.json`.
