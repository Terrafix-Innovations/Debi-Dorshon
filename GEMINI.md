# Debi-Dorshon Project Rules & Conventions

## Virtual Environment & CLI
- Always use `uv run --project backend ...` to execute Python commands, run tests, or run scripts.
- Never use global `python` or `pip`.

## Database (MongoDB)
- Use Motor (`AsyncIOMotorDatabase`) for all database access in FastAPI endpoints.
- Database name: `debi_dorshon_db`, Collection: `pandals`.
- Convert `_id` to string `id` for JSON serialization.

## Geospatial & Routing
- Coordinates are stored as `{"latitude": float, "longitude": float}`.
- OSRM uses GeoJSON `[longitude, latitude]`.
- Always verify routing changes with `uv run --project backend pytest backend/tests/test_route_planner.py -v`.
