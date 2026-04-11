# Visual Regression Testing

This project uses [Playwright](https://playwright.dev/) to take full-page screenshots at three viewports and compare them against a saved baseline. This lets you catch unintentional UI regressions — missing sections, broken responsive layouts, spacing drift — without running a CI pipeline.

## Viewports

| Project   | Width × Height |
|-----------|----------------|
| `mobile`  | 375 × 812      |
| `tablet`  | 768 × 810      |
| `desktop` | 1440 × 900     |

## Setup

1. **Install dependencies** (first time only):
   ```bash
   yarn
   ```

2. **Install Playwright browsers** (first time only):
   ```bash
   yarn playwright install --with-deps
   ```

## Workflow

### 1. Start your development server

```bash
yarn dev       # or: npm run dev / next dev
```

The test suite defaults to `http://localhost:3000`. Override with the `PLAYWRIGHT_BASE_URL` environment variable:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:4000 yarn test:ui
```

### 2. Create (or update) the baseline snapshots

Run this **once after you have confirmed the UI matches the design**:

```bash
yarn test:ui:update
```

Snapshots are saved to `tests/<spec-file>-snapshots/` and should be committed to Git so the baseline is shared with the team.

### 3. Check for regressions

Every time you or an AI assistant changes the UI, run:

```bash
yarn test:ui
```

- **Pass** — the UI looks the same as the baseline.
- **Fail** — a diff image is generated showing exactly what changed. Use the diff to guide further fixes.

### 4. View the HTML report

```bash
yarn ui:report
```

This opens an interactive Playwright report in your browser with before/after/diff images for every failed test.

## Adding more routes

Edit `tests/visual.spec.js` and add entries to the `routes` array:

```js
const routes = ['/', '/pricing', '/about'];
```

Then re-run `yarn test:ui:update` to generate baselines for the new routes.

## Tips

- Set `maxDiffPixelRatio` in `playwright.config.js` to control strictness (default `0.01` = 1 %).
- If the page has animations or lazy-loaded images, wait for a specific element or load state in `tests/visual.spec.js` before the screenshot call, e.g. `await page.waitForSelector('[data-loaded]')` or `await page.waitForLoadState('networkidle')`.
- Snapshot files are binary PNGs — keep them in Git so everyone works from the same baseline.
