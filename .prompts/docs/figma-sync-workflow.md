# Figma Sync Workflow

## 1) Export a snapshot
- Copy `.env.example` → `.env`
- Fill `FIGMA_TOKEN` and `FIGMA_FILE_KEY`
- Run:
  - `yarn figma:export`
- Output:
  - `figma/exports/<timestamp>-nodes.json`
- Also updates:
  - `figma-mapping.json` (`latestSnapshot` + `previousSnapshot` pointers)

## 2) Diff snapshots
- Run:
  - `yarn figma:diff`
- Output:
  - `figma/reports/<YYYY-MM-DD>-diff.json`

## 3) Sync mapping (safe, no code edits)
- Run:
  - `yarn figma:sync -- figma/reports/<YYYY-MM-DD>-diff.json`
- Effects:
  - Updates `figma-mapping.json` (rename/move/deprecate/add placeholders)
  - Writes a plan file:
    - `figma/reports/<YYYY-MM-DD>-sync-plan.json`

## 4) Use AI (optional) for code updates
Provide to AI:
- `figma/reports/<date>-diff.json`
- `figma/reports/<date>-sync-plan.json`
- `figma-mapping.json`
Then ask AI to update the referenced codebase (in your real app repo).