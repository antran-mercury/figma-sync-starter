# figma-sync-starter (sync-only)

This repo helps you manage **incremental Figma → code updates** (no full regeneration) by:
- exporting **snapshots** from Figma (with `nodeId`)
- diffing old vs new snapshots to detect **whether anything changed**
- maintaining `figma-mapping.json` (nodeId → component/file) for traceability & safe updates
- generating a `diff report` + `sync plan` you can feed into an AI to update code in your **real app repo**

> This repo **does not modify your app UI code**. It produces artifacts (snapshot/diff/mapping/plan).

---

## Setup

### Install
```bash
yarn
```

### Create `.env`
```bash
cp .env.example .env
# fill FIGMA_TOKEN and FIGMA_FILE_URL + FIGMA_NODE_IDS
# FIGMA_FILE_KEY is optional (fallback if URL is unavailable)
```

---

## Snapshot manifest (enterprise-style pinning)

To avoid developers accidentally choosing the wrong `<old>` / `<new>` snapshots, this repo pins snapshot paths in:

- `figma/snapshots.json`

It stores:
- `previous`: the snapshot used as the diff base
- `latest`: the newest exported snapshot
- `history`: append-only log of snapshot transitions

`yarn figma:export` updates this manifest automatically.  
`yarn figma:diff` uses this manifest by default.

---

## Commands

### Export snapshot
```bash
yarn figma:export
```
Outputs:
- `figma/exports/<timestamp>-nodes.json`
Updates:
- `figma/snapshots.json` (previous/latest)
- `figma-mapping.json` snapshot pointers (kept for backward compatibility)

### Diff snapshots (no arguments needed)
```bash
yarn figma:diff
```
Outputs:
- `figma/reports/<YYYY-MM-DD>-diff.json`

> You can still override manually for debugging:
> `yarn figma:diff -- figma/exports/old.json figma/exports/new.json`

### Sync mapping using a diff report
```bash
yarn figma:sync -- figma/reports/<YYYY-MM-DD>-diff.json
```
Updates `figma-mapping.json` (rename/move/deprecate/add placeholders) and writes:
- `figma/reports/<YYYY-MM-DD>-sync-plan.json`

### Validate mapping
```bash
yarn figma:mapping:validate -- figma-mapping.json
```

---

# Prompt #1 — Init project (first-time Figma → Code conversion)

```text
You are a Senior Frontend Engineer and Design Systems Lead. Convert a Figma design into production-ready code and set up a maintainable Figma→Code sync workflow.

THIS TASK IS FOR: Initial project setup / first-time Figma-to-code conversion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERACTION MODE (REQUIRED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do NOT ask open-ended questions or start coding yet.
Instead, work through the following steps one at a time:
present the lettered options, wait for the user to choose, then move to the next step.

STEP 1 — Figma input method
How will you provide the Figma design?
  A) Figma File URL + Node IDs (e.g. https://figma.com/file/XXX + nodeIds: 123:456,789:101)
  B) FIGMA_FILE_KEY + Node IDs only (URL not available)
  C) Pasted JSON / plugin export containing nodeId(s) — assistant works from this export only

→ Reply with A, B, or C (and paste the URL/key/export as needed).

STEP 2 — Implementation target (shown after Step 1 is answered)
Where should the code land?
  A) Brand-new repository (scaffold from scratch)
  B) Existing repository (add components alongside existing code)

→ Reply with A or B.

STEP 3 — Stack selection (shown after Step 2 is answered)
Which stack?
  A) Next.js + React + TypeScript + Tailwind
  B) React (Vite/CRA) + TypeScript + CSS Modules
  C) Vue 3 + TypeScript + Tailwind
  D) Other — specify (framework, styling, component library, token source)

→ Reply with A, B, C, or D.

After all three steps are answered, ask any remaining clarifying questions as a numbered list (breakpoints, states, data contracts, repo conventions), then wait before generating any code or artifacts.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIGMA ACCESS (IMPORTANT)
- Figma File URL (preferred): <paste full Figma URL — file key will be parsed from it>
- Node IDs in scope (required): <comma-separated node-ids, e.g. 123:456,789:101>
- FIGMA_FILE_KEY (optional fallback): <paste key — only if URL is unavailable>
- If you (the assistant) cannot access Figma API directly, I (the user) will provide an exported JSON/plugin dump containing the nodeId(s). In that case, you MUST work only from the provided export and MUST NOT guess or include additional nodes/pages.

GOALS
- Implement the UI from the provided Figma frames using clean, reusable components (no full-page monolith).
- Establish stable Figma→Code mapping using Figma Node IDs as primary keys.
- Establish snapshot exports in the repo for future incremental diffs.

INPUTS I WILL PROVIDE
- Figma File URL (preferred) + Node IDs in scope (e.g. 123:456,789:101), or exported JSON/plugin dump with nodeId(s)
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
```

---

# Prompt #2 — Detect Figma changes + ask AI to sync updates (incremental)

## Step A — Export + diff
```bash
yarn figma:export
yarn figma:diff
```

## Step B — Prompt the AI to update code in your app repo
```text
You are a Senior Frontend Engineer maintaining a Figma-to-code implementation.

TASK: Sync our codebase with the latest Figma updates using incremental changes (DO NOT regenerate everything).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERACTION MODE (REQUIRED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before reading any files or producing output, present the options below and wait for the user to choose.

STEP 1 — Sync scope
What nodes should this sync cover?
  A) All changed nodes from the diff report (full diff)
  B) A specific subset of nodeIds — I will list them now
  C) Unsure — stop and show me the diff summary first, then I will decide

→ Reply with A, B, or C (and paste the subset nodeIds if B).

STEP 2 — Output format (shown after Step 1 is answered)
What output do you need from this session?
  A) Plan only — list files to touch + proposed changes, no code edits yet
  B) Plan + code — produce the full patch (file edits) along with the plan
  C) QA checklist only — I have the code; just give me the risk & regression checklist

→ Reply with A, B, or C.

After both steps are answered, proceed with the selected scope and format below.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXT
- Mapping file: figma-mapping.json (nodeId -> component -> filePath)
- Diff report: figma/reports/<YYYY-MM-DD>-diff.json
- (Optional) Sync plan: figma/reports/<YYYY-MM-DD>-sync-plan.json
- Snapshot manifest (preferred source of truth): figma/snapshots.json
- Snapshots:
  - Old snapshot: (manifest.previous)
  - New snapshot: (manifest.latest)
- Token/theme files (if present): src/theme/tokens.css, tailwind.config.ts, src/theme/theme.ts

CRITICAL CONSTRAINTS (DO NOT BREAK BUSINESS LOGIC)
- Do NOT remove or change business logic (if/else, guards, permission checks, validation, feature flags, analytics, error handling).
- Treat business logic as source of truth; only adjust presentation (markup/classes/styles) unless the diff explicitly indicates behavior changes.
- If a UI change conflicts with existing logic, keep the logic and propose a UI-compatible solution.
- If you think logic must change, STOP and ask for confirmation with a minimal patch proposal.

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
- `figma/snapshots.json` prevents mistakes when choosing which snapshots to diff.
- If `diff.json.summary.modified/added/removed` are all `0` ⇒ nothing changed in Figma (skip sync).