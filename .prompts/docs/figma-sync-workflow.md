# Figma Sync Workflow

## 1) Export a snapshot
- Copy `.env.example` → `.env`
- Fill `FIGMA_TOKEN` and `FIGMA_FILE_URL` (preferred) + `FIGMA_NODE_IDS`
  - `FIGMA_FILE_KEY` is optional fallback if URL is unavailable
  - `FIGMA_NODE_IDS` should be a comma-separated list of node-ids (e.g. `123:456,789:101`) to pin the export scope
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

Then use the prompt in `.prompts/sync-figma-update.md`.
The assistant will present choices for sync scope and output format before proceeding — select the options that match your needs.