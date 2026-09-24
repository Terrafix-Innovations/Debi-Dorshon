# CLAUDE.md — Claude Code & OpenCode Instructions

> Read AGENTS.md first — it contains the full project rules and CodeGraph workflow.
> This file adds Claude-specific overrides only.

## CodeGraph CLI (No MCP)

This project uses CodeGraph **without** the MCP server. Use the CLI directly via shell:

```bash
# First thing every session:
codegraph explore "<what you're working on>"

# Targeted queries:
codegraph query <symbol>
codegraph node <symbol>
codegraph callers <symbol>
codegraph callees <symbol>
codegraph impact <symbol>
codegraph context "<task description>"
codegraph affected <file>
```

**Do NOT run `codegraph serve` or expect MCP tools.** Everything is CLI-only.

## Session Persistence

- After completing major work, summarize what was done and what's left.
- Before starting, run `codegraph explore` to reorient — the index is always current.
- Use `codegraph impact` before any refactor to understand blast radius.

## Python Commands

Always prefix with `uv run --project backend`:
```bash
uv run --project backend pytest backend/tests/ -v
uv run --project backend uvicorn app.main:app --reload
```

Never use bare `python` or `pip`.
