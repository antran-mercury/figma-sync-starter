# figma-sync-starter (sync-only)

This repo helps you manage **incremental Figma → code updates** (no full regeneration) by:
- exporting **snapshots** from Figma (with `nodeId`)
- diffing old vs new snapshots to detect **whether anything changed**
- maintaining `figma-mapping.json` (nodeId → component/file) for traceability & safe updates
- generating a `diff report` + `sync plan` you can feed into an AI to update code in your **real app repo**

> This repo **does not modify your app UI code**. It produces artifacts (snapshot/diff/mapping/plan).

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn
- A Figma Personal Access Token ([how to create one](https://www.figma.com/developers/api#access-tokens))

### Step-by-step setup

1. **Install dependencies**
   ```bash
   yarn
   ```

2. **Configure `.env`** — copy `.env.example` to `.env` and fill in your Figma token:
   ```env
   FIGMA_TOKEN=figd_your_personal_access_token_here
   ```

3. **Fill in the designer brief** — open `.prompts/designer-brief.md` and fill in your project details (project name, framework, Figma URL, node IDs, pages, colors, behaviors).

4. **Parse the designer brief** — this updates `figma-mapping.json`, `.env`, and behavior notes automatically:
   ```bash
   yarn designer:brief
   ```

5. **Export Figma snapshot** — this calls the Figma API and saves node data to `figma/exports/`. **This step is required before generating the AI prompt.**
   ```bash
   yarn figma:export
   ```

6. **Generate the AI init prompt**:
   ```bash
   yarn ai:init
   ```

7. **Paste the prompt into your AI assistant** — open `figma/prompts/<YYYY-MM-DD>-init-prompt.md` and copy its full contents into your AI assistant (e.g., Claude, ChatGPT, GitHub Copilot). The AI will use the pre-filled context to implement your UI.

---

## Setup

### Install
```bash
yarn
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

## AI prompt automation

These commands assemble **fully pre-filled AI prompts** by reading your `.prompts/` files and injecting all project context (config, diff reports, behavior notes) automatically. Paste the output into any AI assistant and it can start working immediately — no manual clarifying-question cycle.

### `yarn designer:brief` — let designers configure the project (no JSON required)

```bash
yarn designer:brief
```

Designers don't need to know JSON. They edit **one plain Markdown file**:

```
.prompts/designer-brief.md
```

and the script automatically updates all the config files.

**What the designer fills in** (in `.prompts/designer-brief.md`):
- Project name, framework, language, styling, UI library, font
- Figma file URL and page names
- Brand colors / design tokens
- Per-frame info: Node ID, component name, file path, breakpoint, notes
- Interaction behavior for any frame (trigger, states, animation, AI notes)

**What the script updates automatically:**
| Output | What changes |
|--------|-------------|
| `figma-mapping.json` | `project`, `figma`, `entries[]`, `tokens.colors` |
| `.prompts/note_behavior/<node-id>.md` | Created (or updated with history preserved) per behavior section |
| `.env` | `FIGMA_FILE_URL`, `FIGMA_NODE_IDS` (existing keys like `FIGMA_TOKEN` are preserved) |

**Designer workflow:**

```
1. Designer opens  .prompts/designer-brief.md  and fills it in (plain Markdown)
2. Developer runs: yarn designer:brief
3. Developer runs: yarn ai:init
4. Paste  figma/prompts/<date>-init-prompt.md  into your AI assistant → implement!
```

**Example `.prompts/designer-brief.md` snippet:**

```markdown
## Project
- Name: Mercury Landing Page
- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS
- Font: Inter (body), Playfair Display (heading)

## Figma
- File URL: https://www.figma.com/design/ABC123/Mercury-Landing
- Pages: Home Page

## Pages

### Home Page - Desktop
- Node ID: 148:4463
- Component: HomeDesktop
- File: src/pages/home/HomeDesktop.tsx
- Breakpoint: >= 1280px
- Notes: Hero with hotspot markers.

## Behavior: 148:4463

### Trigger
User clicks hotspot marker on hero image

### Behavior
Show tooltip. Only 1 open at a time.
```

### `yarn ai:init` — init prompt (first-time setup)

```bash
yarn ai:init
```

Reads:
- `.prompts/figma-to-react-spec.md`
- `figma-mapping.json` (stack, repo, conventions)
- `.env` (`FIGMA_FILE_URL`, `FIGMA_NODE_IDS`)
- `figma/figma.config.json` (framesInScope)
- `.prompts/note_behavior/*.md` (latest section per node)

Outputs:
- `figma/prompts/<YYYY-MM-DD>-init-prompt.md`

### `yarn ai:sync` — sync prompt (after a Figma update)

```bash
yarn ai:sync
```

Reads:
- `.prompts/sync-figma-update.md`
- `figma/reports/<latest>-diff.json`
- `figma/reports/<latest>-sync-plan.json`
- `figma-mapping.json`
- `.prompts/note_behavior/*.md` (filtered to changed nodes)

Outputs:
- `figma/prompts/<YYYY-MM-DD>-sync-prompt.md`

### `yarn figma:pipeline` — full automated pipeline

Runs the entire workflow in one command:

```bash
yarn figma:pipeline
```

Equivalent to:
1. `yarn figma:export` → export Figma snapshot
2. `yarn figma:diff`   → diff old vs new snapshot
3. `yarn figma:sync`   → update mapping (auto-detects latest diff)
4. `yarn ai:sync`      → assemble pre-filled sync prompt

---

## Recommended practice

- Commit snapshots + diff reports into Git for auditing:
  - `figma/exports/…`
  - `figma/reports/…`
- `figma/snapshots.json` prevents mistakes when choosing which snapshots to diff.
- If `diff.json.summary.modified/added/removed` are all `0` ⇒ nothing changed in Figma (skip sync).

---

## AI Prompts

Pre-written prompts for common scenarios are stored in `.prompts/`:

| Scenario | When to use | How to get the prompt |
|----------|-------------|----------------------|
| **Bootstrap mapping** (one-time, existing project) | You have a working codebase and want to establish a `figma-mapping.json` baseline for future incremental syncs. | Open [`.prompts/prompt-03-bootstrap-mapping.md`](.prompts/prompt-03-bootstrap-mapping.md) and paste into your AI assistant. |
| **Init project** (first-time Figma → Code) | Starting from scratch — convert Figma frames into production-ready components and set up the sync workflow. | Run [`yarn ai:init`](#yarn-aiinit--init-prompt-first-time-setup) → open `figma/prompts/<date>-init-prompt.md` and paste into your AI assistant. |
| **Sync updates** (incremental, after Figma change) | Figma was updated — apply only the changed nodes to your codebase. | Run [`yarn ai:sync`](#yarn-aisync--sync-prompt-after-a-figma-update) → open `figma/prompts/<date>-sync-prompt.md` and paste into your AI assistant. |

### How to use Prompt #3 (Bootstrap mapping)

1. Run `yarn figma:export` to capture a baseline snapshot.
2. Open [`.prompts/prompt-03-bootstrap-mapping.md`](.prompts/prompt-03-bootstrap-mapping.md) and copy its contents into your AI assistant (Claude, ChatGPT, GitHub Copilot, etc.).
3. Follow the AI's guided Q&A to produce `figma-mapping.json` and `docs/figma-mapping.md`.
4. Commit the generated files — future syncs will use them for incremental updates (`yarn figma:pipeline`).