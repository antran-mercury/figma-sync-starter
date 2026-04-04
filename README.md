# figma-sync-starter (sync-only)

This repo helps you manage **incremental Figma → code updates** (no full regeneration) by:
- exporting **snapshots** from Figma (with `nodeId`)
- diffing old vs new snapshots to detect **whether anything changed**
- maintaining `figma-mapping.json` (nodeId → component/file) for traceability & safe updates
- generating a `diff report` + `sync plan` you can feed into an AI to update code in your **real app repo**

> This repo **does not modify your app UI code**. It produces artifacts (snapshot/diff/mapping/plan) you can use to update your main product repo.

---

## Setup

### 1) Install
```bash
yarn
```

### 2) Create `.env`
```bash
cp .env.example .env
# fill FIGMA_TOKEN and FIGMA_FILE_KEY
```

---

## Commands

### Export snapshot
```bash
yarn figma:export
```
Outputs:
- `figma/exports/<timestamp>-nodes.json`
- updates `figma-mapping.json` (latestSnapshot/previousSnapshot)

### Diff snapshots (to detect if Figma changed)
```bash
yarn figma:diff
# or specify:
yarn figma:diff -- figma/exports/old.json figma/exports/new.json
```
Outputs:
- `figma/reports/<YYYY-MM-DD>-diff.json`

### Sync mapping (safe scope: update mapping + generate a plan)
```bash
yarn figma:sync -- figma/reports/<YYYY-MM-DD>-diff.json
```
Outputs:
- updates `figma-mapping.json` (rename/move/deprecate/add placeholder entries)
- writes `figma/reports/<YYYY-MM-DD>-sync-plan.json`

### Validate mapping
```bash
yarn figma:mapping:validate -- figma-mapping.json
```

---

# Prompt #1 — Init project (first-time Figma → Code conversion)

Use this when you start a new project or implement the UI from Figma for the first time.

```text
You are a Senior Frontend Engineer and Design Systems Lead. Convert a Figma design into production-ready code and set up a maintainable Figma→Code sync workflow.

THIS TASK IS FOR: Initial project setup / first-time Figma-to-code conversion.

FIGMA ACCESS (IMPORTANT)
- Figma File URL: <paste URL>
- FIGMA_FILE_KEY: <paste key>
- Frames in scope: <exact frame names OR node-ids>
- If you (the assistant) cannot access Figma API directly, I (the user) will provide exported JSON/plugin dump that contains nodeId(s). In that case, you MUST work only from the provided export.

GOALS
- Implement the UI from the provided Figma frames using clean, reusable components (no full-page monolith).
- Establish stable Figma→Code mapping using Figma Node IDs as primary keys.
- Establish snapshot exports in the repo for future incremental diffs.

INPUTS I WILL PROVIDE
- Figma file link + exact page/frame name(s) to implement (or exported JSON/plugin dump with nodeId)
- Target stack (e.g. Next.js + React + TypeScript)
- Styling (Tailwind / CSS Modules / etc.)
- Component library (if any)
- Token source (Figma Variables / Tokens Studio / existing theme files / none)
- Breakpoints + responsive targets
- Required states (hover/focus/disabled/loading/empty/error)
- Accessibility requirements (WCAG target if any)
- Data contracts (real API shapes or stubs allowed)
- Repo conventions (folder structure, eslint/prettier rules)

DELIVERABLES (MUST PRODUCE ALL)
1) Ask clarifying questions first (do NOT start coding until I answer).
2) Architecture proposal (reuse strategy, component breakdown, token strategy).
3) Exact file/folder structure (tree with filenames).
4) Figma → Code Mapping Table (Page/Frame, Node name/type, Node ID, Component name, file path, props, notes).
5) Create/Update mapping artifacts:
   - figma-mapping.json (machine-readable, nodeId -> component/filePath)
   - docs/figma-mapping.md (human-readable)
6) Snapshot export baseline:
   - save figma/exports/<YYYY-MM-DD>-nodes.json (must include nodeId)
7) Generate production-ready code (TypeScript) with accessibility and responsive behavior.
8) Provide usage examples or stories for key components.
9) Quality checklist (a11y, performance, consistency).

CONSTRAINTS
- Avoid absolute positioning unless strictly required.
- Prefer tokens over hard-coded values.
- Preserve stable public APIs for reusable components.

FIRST, ASK ME (wait for answers)
1) Stack + versions?
2) Styling approach?
3) Which frames (exact names OR node-ids) are in scope?
4) Token strategy (Figma Variables? existing tokens?) + dark mode?
5) Breakpoints?
6) Required states?
7) Data contracts or stubs?
8) Repo conventions to follow?
9) Confirm the input method:
   A) I will provide exported JSON/plugin dump with nodeIds, OR
   B) You should rely on the Figma URL + FIGMA_FILE_KEY (and I will ensure access).
```

---

# Prompt #2 — Detect Figma changes + ask AI to sync updates (incremental)

Use this workflow when you want to check if Figma changed, and if it did, update code based on the diff.

## Step A — Generate snapshot + diff (local)
1) Export a new snapshot:
```bash
yarn figma:export
```

2) Generate a diff report:
```bash
yarn figma:diff
```

3) (Optional but recommended) Generate a sync plan + update mapping:
```bash
yarn figma:sync -- figma/reports/<YYYY-MM-DD>-diff.json
```

## Step B — Prompt the AI to update code in your app repo
Copy/paste this prompt (and attach the report/mapping files if the AI cannot access your repo):

```text
You are a Senior Frontend Engineer maintaining a Figma-to-code implementation.

TASK: Sync our codebase with the latest Figma updates using incremental changes (DO NOT regenerate everything).

CONTEXT
- App Repo: <owner>/<repo>
- Stack: Next.js + React + TypeScript + Tailwind (adjust if different)
- Mapping file: figma-mapping.json (nodeId -> component -> filePath)
- Diff report: figma/reports/<YYYY-MM-DD>-diff.json
- (Optional) Sync plan: figma/reports/<YYYY-MM-DD>-sync-plan.json
- Snapshots:
  - Old snapshot: figma/exports/<old>-nodes.json
  - New snapshot: figma/exports/<new>-nodes.json
- Token/theme files (if present): src/theme/tokens.css, tailwind.config.ts, src/theme/theme.ts

WHAT YOU MUST DO
1) Read the diff report and produce a Change Impact Report:
   - Added nodeIds
   - Removed nodeIds
   - Modified nodeIds
   - Categorize each change as: token/style/layout/content/variant
2) For each changed nodeId, look it up in figma-mapping.json and list EXACT files to update (file paths).
3) Apply minimal code edits only (preserve architecture and public APIs).
4) If changes are token-only, update tokens/theme instead of editing many components.
5) Update mapping to latest (REQUIRED, NO DATA LOSS):
   - Do NOT delete entries blindly.
   - Renamed/moved nodes: update node metadata only, preserve code linkage fields.
   - Removed nodeIds: mark mapping entry status=deprecated and record deprecatedAt/history.
   - Added nodeIds: append new mapping entries with status=active.
6) Output:
   A) Change Impact Report
   B) Files-to-touch list grouped by component
   C) Proposed patch summary (what to change in each file)
   D) Risks & QA checklist (visual regression points)

START NOW by reading figma/reports/<YYYY-MM-DD>-diff.json and figma-mapping.json.
```

---

## Recommended practice
- Commit snapshots + diff reports into Git for auditing:
  - `figma/exports/…`
  - `figma/reports/…`
- `figma-mapping.json` is the source of truth for linking nodeIds to code files.
- If `diff.json.summary.modified/added/removed` are all `0` ⇒ nothing changed in Figma (skip sync).