---
name: codegraph-workflow
description: Use this skill when starting a new task, exploring unfamiliar code, or before making changes to understand dependencies and blast radius. CodeGraph provides a pre-indexed knowledge graph of the entire codebase.
---

# CodeGraph Workflow Skill

## What is CodeGraph?
CodeGraph is a pre-indexed code knowledge graph stored in `.codegraph/`. It parses all Python and JSX files into a SQLite database with full-text search, capturing symbols, imports, call edges, and dependencies.

## When to Use
- **Starting a new task**: Run `codegraph explore` to get oriented
- **Before modifying code**: Run `codegraph impact` to understand blast radius
- **Finding symbol definitions**: Run `codegraph query` instead of grep
- **Understanding call chains**: Run `codegraph callers`/`codegraph callees`
- **Before running tests**: Run `codegraph affected` to know which tests matter

## CLI Commands Reference

### Orientation (run at session start)
```bash
codegraph status                          # verify index health (448 nodes, 803 edges)
codegraph explore "<task description>"    # get relevant symbols + source + blast radius
```

### Symbol Lookup
```bash
codegraph query <symbol_name>             # search for symbol definitions/locations
codegraph node <symbol_name>              # one symbol's full source + callers + callees
codegraph node --file <path>              # read file with line numbers + dependents
codegraph context "<task description>"    # build comprehensive context for a task
```

### Dependency Analysis
```bash
codegraph callers <symbol>                # who calls this symbol?
codegraph callees <symbol>                # what does this symbol call?
codegraph impact <symbol>                 # full blast radius of changing a symbol
codegraph affected <file_path>            # which tests/files are affected by changes?
```

### Maintenance (rarely needed)
```bash
codegraph sync                            # manual sync (auto-sync is on by default)
codegraph index                           # full reindex from scratch
```

## Key Rules
1. **CodeGraph output IS the file content** — don't re-read files it already returned
2. **Always check impact before refactoring** — `codegraph impact <symbol>`
3. **The index auto-syncs** — no need to manually re-index after edits
4. **Falls back gracefully** — if codegraph doesn't cover something (env vars, config), use grep/read

## Project Index Stats
- **54 files** indexed (36 Python, 15 JSX, 2 JS, 1 YAML)
- **448 nodes**: 203 imports, 90 functions, 53 files, 40 variables, 30 methods, 24 classes, 8 constants
- **803 edges** (call relationships, imports, dependencies)
- **DB size**: 1.30 MB (SQLite with WAL)
