# Debi-Dorshon Project Rules & Conventions

> Also read AGENTS.md for the full CodeGraph workflow and architecture overview.

## 🔑 CodeGraph — Use It First

This project has a pre-indexed code knowledge graph. **Always start with CodeGraph before grepping or reading files:**

```bash
codegraph explore "<your task>"     # symbols + source + blast radius
codegraph query <symbol>            # find definitions
codegraph node <symbol>             # source + callers/callees
codegraph impact <symbol>           # what breaks if you change this
codegraph context "<task>"          # full context for complex work
codegraph affected <file>           # which tests are affected
```

CodeGraph returns verbatim source with line numbers — treat its output as a file read already done.

## 🛑 CRITICAL: Strict Git Policy — NEVER ADD, COMMIT, OR PUSH
- **NEVER** run `git add`, `git commit`, or `git push` automatically or proactively.
- You are ONLY permitted to inspect git state using read-only commands: `git status`, `git log`, `git diff`.
- All staging, committing, and pushing must be explicitly commanded by the user or done manually by the user.

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
