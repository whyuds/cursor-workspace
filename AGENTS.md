# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

FundPilot（基金浮动定投助手）is a self-contained Node.js/TypeScript CLI tool located entirely in `.agents/skills/fundpilot/`. There is no Docker, no external database, and no microservices — just a single CLI backed by an embedded SQLite database (via `sql.js` WASM).

### Running the CLI

```bash
node .agents/skills/fundpilot/dist/index.js <command> --json
```

All commands **must** include the `--json` flag. See `.agents/skills/fundpilot/SKILL.md` for the full command reference.

### Build

```bash
cd .agents/skills/fundpilot && npm run build
```

This runs `tsc` to compile `src/` → `dist/`. The pre-compiled `dist/` directory is committed, so a build is only needed after modifying TypeScript source files.

### Lint / Tests

- No ESLint config or test framework is present in the repository. TypeScript strict-mode compilation (`tsc`) serves as the primary static check.
- To verify type correctness: `cd .agents/skills/fundpilot && npx tsc --noEmit`

### Data storage

SQLite database is stored at `.agents/skills/fundpilot/.fundpilot/fundpilot.db`. It is auto-created on first CLI invocation. The DB file is committed to Git — be mindful of data sensitivity in public repos.

### External dependencies

The only network dependency is the Eastmoney (天天基金) quote API (`http://fundgz.1234567.com.cn/js/{code}.js`), used only by `signal today`, `signal today-all`, and `position upsert` (without explicit `--cost`). All other commands work fully offline.

### Gotchas

- The `operation list --code=XXX` filter may return empty if operations were recorded under a different fund-code context; use `operation list --json` (without `--code`) to see all records.
- The `dist/` directory is committed; after source changes always rebuild before testing.
