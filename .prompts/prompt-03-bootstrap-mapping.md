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
