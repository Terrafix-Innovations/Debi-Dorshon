---
name: backend-dev-and-test
description: >-
  Use this skill when developing, testing, or debugging the FastAPI backend, running tests with pytest, or checking endpoint health.
---

# Backend Development & Testing Runbook

## Environment & Commands
- virtualenv manager: **Astral uv**
- Start dev server:
  ```bash
  uv run --project backend uvicorn app.main:app --reload
  ```
- Run unit & integration test suite:
  ```bash
  uv run --project backend pytest backend/tests -v
  ```

## Docker Management
When running with Docker:
```bash
docker compose up --build -d
```
Note: If local Uvicorn is also run, avoid port collisions on `8000`.
