# Debi-Dorshon — Agent Instructions

> This file is the single source of truth for all AI coding agents working on this project.
> It is read by Claude Code, OpenCode, Gemini CLI, Antigravity IDE, and any agent that supports AGENTS.md.

---

## 🔑 CodeGraph — Use It First, Always

This project has a **pre-indexed code knowledge graph** (CodeGraph). It lives in `.codegraph/` and auto-syncs on file changes. **Use CodeGraph CLI commands BEFORE grepping or reading files.** This saves tokens, avoids context bloat, and gives you structural understanding instantly.

### Mandatory Workflow (every session)

1. **Orientation — run this first:**
   ```bash
   codegraph status                          # verify index is healthy
   codegraph explore "<your task summary>"   # get relevant symbols + source + blast radius
   ```

2. **Targeted lookup — when you need specifics:**
   ```bash
   codegraph query <symbol_name>             # find symbol definitions/locations
   codegraph node <symbol_name>              # one symbol's source + callers/callees
   codegraph node --file <path>              # read file with line numbers + dependents
   codegraph callers <symbol>                # who calls this?
   codegraph callees <symbol>                # what does this call?
   codegraph context "<task description>"    # build full context for a complex task
   ```

3. **Impact analysis — before making changes:**
   ```bash
   codegraph impact <symbol>                 # blast radius of changing a symbol
   codegraph affected <file_path>            # which tests/files are affected?
   ```

4. **Only then** fall back to grep/read for things CodeGraph doesn't cover (config files, env vars, raw text search).

### Why This Matters
- CodeGraph returns **verbatim on-disk source** with line numbers — treat its output as a file read you already performed.
- It shows **blast radius** (callers, dependents) so you know what to test.
- It eliminates the "discovery loop" of grep → read → grep → read that burns tokens.

---

## 📋 Project Rules & Conventions

### Virtual Environment & CLI
- Always use `uv run --project backend ...` to execute Python commands, run tests, or run scripts.
- Never use global `python` or `pip`.

### Database (MongoDB)
- Use Motor (`AsyncIOMotorDatabase`) for all database access in FastAPI endpoints.
- Database name: `debi_dorshon_db`, Collection: `pandals`.
- Convert `_id` to string `id` for JSON serialization.

### Geospatial & Routing
- Coordinates are stored as `{"latitude": float, "longitude": float}`.
- OSRM uses GeoJSON `[longitude, latitude]`.
- Always verify routing changes with `uv run --project backend pytest backend/tests/test_route_planner.py -v`.

### Code Style
- Python: Follow existing patterns in `backend/app/`. Type hints required.
- React (JSX): Components in `frontend-web/src/components/`. Functional components with hooks.
- All API endpoints are under `backend/app/api/v1/endpoints/`.
- Schemas in `backend/app/schemas/`, services in `backend/app/services/`.

### Testing
- Run all backend tests: `uv run --project backend pytest backend/tests/ -v`
- Run specific test file: `uv run --project backend pytest backend/tests/<test_file>.py -v`
- Frontend dev server: `npm run dev` (from `frontend-web/`)
- Backend dev server: `uv run --project backend uvicorn app.main:app --reload` (from `backend/`)

---

## 🏗️ Project Architecture

```
Debi-Dorshon/
├── backend/              # FastAPI + Motor (MongoDB) + OSRM routing
│   ├── app/
│   │   ├── api/v1/endpoints/   # Route handlers
│   │   ├── core/               # Config, DB, cache, rate limiting
│   │   ├── schemas/            # Pydantic models
│   │   └── services/           # Business logic (route planner, etc.)
│   └── tests/
├── frontend-web/         # React (Vite) web frontend
│   └── src/components/
├── frontend-app/         # Mobile app (if applicable)
├── data/                 # Static data files (debi_dorshon.json, etc.)
├── scripts/              # Utility scripts
├── .codegraph/           # CodeGraph index (auto-generated, gitignored)
└── .agents/skills/       # Agent skills (Antigravity-specific)
```

---

## ⚠️ Common Pitfalls

- **Don't read files CodeGraph already returned.** Its output IS the file content.
- **Don't forget `codegraph impact`** before refactoring a symbol — it tells you exactly what breaks.
- **Coordinate order matters:** MongoDB stores `{lat, lng}`, OSRM expects `[lng, lat]`.
- **Always run tests** after touching routing logic.
