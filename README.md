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
   A) I will provide exported JSON/plugin dump with nodeIds (use ONLY those nodes — do NOT fetch additional nodes/pages), OR
   B) You should rely on the Figma File URL + Node IDs in scope (do NOT browse beyond those nodes).
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

---

# Prompt #3 — Bootstrap mapping (one-time) for an existing project

Use this prompt when you already have a working codebase (no existing `figma-mapping.json`) and want to establish a baseline mapping so future updates can be incremental.

## Step A — Export a baseline snapshot
```bash
yarn figma:export
```

## Step B — Prompt the AI to create the baseline mapping

```text
You are a Senior Frontend Engineer and Design Systems Lead.

GOAL
Help me bootstrap a Figma→Code mapping for an existing project that already matches Figma ~90%.
This is a one-time baseline setup so future updates can be incremental (export → diff → sync-plan → minimal code edits).

INPUTS
- App repository: <owner>/<repo>
- Architecture type (choose one):
  A) Component-based (React / Next.js / Vue / Angular — discrete component files)
  B) Template-based / monolith (PHP / AngularJS / WordPress — no discrete component files)
- Router / template convention (if A): <App Router | Pages Router | src/components/…>
- Template directories (if B): <e.g. views/*.php, partials/*.php, app/views/*.html>
- Figma File URL: <paste URL>
- Node IDs in scope (comma-separated): <id1,id2,...> (mix of design-system components + screens)
- Figma snapshot export JSON: <paste contents of figma/exports/<timestamp>-nodes.json OR attach it>
- (Optional) Existing route list or sitemap: <paste if available>

INTERACTION MODE (REQUIRED)
First, confirm the architecture type (A or B) and wait for my answer before proceeding.

WHAT YOU MUST DO
1) Parse the provided snapshot JSON and list all nodes in scope in a table:
   - nodeId, name, type, pageName, frameName
   Group into: "Design system candidates" vs "Screen / frame candidates".

2) Ask me to confirm / adjust the candidate grouping using multiple-choice questions instead of free text.

3) For each confirmed nodeId, propose the best existing code target based on the architecture type:

   IF ARCHITECTURE = A (component-based):
   - componentName: PascalCase name of the component
   - filePath: exact file path in the repo (e.g. src/components/ui/Button.tsx, app/home/page.tsx)
   - confidence (high / med / low) and reasoning

   IF ARCHITECTURE = B (template-based / monolith):
   - filePath: template or page file that renders this node (e.g. views/profile.php, app/views/account.html)
   - anchor: recommend adding `data-figma-node-id="<nodeId>"` on the outer container element of that section
   - selector: `[data-figma-node-id="<nodeId>"]` — to be stored in code.selectors[]
   - componentName: logical label (e.g. ProfileHeader) even if no component class exists

   For both types, if you cannot determine a filePath, ask ONE targeted question
   (e.g. "Which file renders <ScreenName>?") and stop.

4) Output ready-to-commit artifacts:
   A) figma-mapping.json (schemaVersion 1.0.0) with entries for all confirmed nodeIds:
      - status = active
      - node metadata filled
      - code.componentName + code.filePath filled when known, otherwise empty + a note
      - code.selectors: [] for architecture A (leave empty unless a data-attr anchor is added)
      - code.selectors: ['[data-figma-node-id="<nodeId>"]'] for architecture B (once anchor is added)
      - preserve fields for future: api / design / history / notes
   B) docs/figma-mapping.md (human-readable summary table)

5) If architecture = B, also produce a list of markup patches:
   For each mapped nodeId, show the exact HTML attribute to add:
   ```html
   <!-- Add to the outer container in <filePath> -->
   <div data-figma-node-id="<nodeId>" class="...existing classes...">
   ```

6) Produce a short checklist for the next steps:
   - run export again, diff, sync, and how to use sync-plan to update only touched files.

CONSTRAINTS
- Do NOT suggest regenerating the whole UI.
- Do NOT invent nodeIds not present in the provided snapshot JSON.
- Prefer minimal changes: mapping first, code edits (anchor attributes) second.
- If something is ambiguous, ask a targeted question and stop.

START NOW by confirming the architecture type (A or B).
```