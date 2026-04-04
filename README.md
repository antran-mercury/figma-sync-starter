# figma-sync-starter (sync-only)

A small repo to:
- export Figma snapshots (with nodeId)
- diff snapshots
- update/maintain `figma-mapping.json` without losing manual info
- generate a sync plan that you can feed to AI (or use manually)

## Setup
1) Install deps (none required, but Yarn is used for scripts):
```bash
yarn
```

2) Create `.env`:
```bash
cp .env.example .env
# fill FIGMA_TOKEN and FIGMA_FILE_KEY
```

## Commands
### Export snapshot
```bash
yarn figma:export
```
Outputs `figma/exports/<timestamp>-nodes.json` and updates `figma-mapping.json` snapshot pointers.

### Diff snapshots
```bash
yarn figma:diff
# or
yarn figma:diff -- figma/exports/old.json figma/exports/new.json
```
Outputs `figma/reports/<YYYY-MM-DD>-diff.json`.

### Sync mapping using diff report
```bash
yarn figma:sync -- figma/reports/<YYYY-MM-DD>-diff.json
```
Updates `figma-mapping.json` (rename/move/deprecate/add placeholders) and writes:
- `figma/reports/<YYYY-MM-DD>-sync-plan.json`

### Validate mapping
```bash
yarn figma:mapping:validate -- figma-mapping.json
```

## Notes
- This repo does not modify your app code. It outputs a diff report + sync plan for use in your real app repo.
- If you want auto-code updates, we can extend `figma:sync` later (but it depends heavily on your app architecture).