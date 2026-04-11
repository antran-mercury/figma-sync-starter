/**
 * ai-prompt-init.mjs
 *
 * Assembles a fully pre-filled AI prompt for the initial Figma → code implementation.
 * Reads .prompts/figma-to-react-spec.md and injects project context so the AI can
 * start implementing without waiting for manual clarifying-question answers.
 *
 * Usage:  yarn ai:init
 * Output: figma/prompts/<YYYY-MM-DD>-init-prompt.md  (also printed to stdout)
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Helpers (shared pattern with other figma scripts)
// ---------------------------------------------------------------------------

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2] ?? "";
    value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (!process.env[key]) process.env[key] = value;
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeReadJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return readJson(p);
  } catch {
    return fallback;
  }
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

// ---------------------------------------------------------------------------
// Read behavior notes — return only the "Latest" section per node
// ---------------------------------------------------------------------------

function readBehaviorNotes(notesDir) {
  const skip = new Set(["README.md", "TEMPLATE.md"]);
  if (!fs.existsSync(notesDir)) return [];

  return fs
    .readdirSync(notesDir)
    .filter((f) => f.endsWith(".md") && !skip.has(f))
    .map((f) => {
      const nodeId = path.basename(f, ".md").replace(/-/g, ":");
      const raw = fs.readFileSync(path.join(notesDir, f), "utf8");

      // Extract only the "## Latest" section (stop at "## History" or end of file)
      const latestMatch = raw.match(/##\s+Latest\s*\n([\s\S]*?)(?=\n---|\n##\s+History|$)/);
      const latest = latestMatch ? latestMatch[1].trim() : raw.trim();

      return { nodeId, latest };
    })
    .filter((n) => n.latest.length > 0);
}

// ---------------------------------------------------------------------------
// Resolve "nice" display values — mark unconfigured fields clearly
// ---------------------------------------------------------------------------

function display(value, fallback) {
  const empty = [undefined, null, "", "n/a", "sync-only", "figma-variables|manual"];
  return empty.includes(value) ? fallback : value;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  loadEnv();

  const mapping = safeReadJson("figma-mapping.json", {});
  const config = safeReadJson("figma/figma.config.json", {});
  const promptTemplate = fs.readFileSync(".prompts/figma-to-react-spec.md", "utf8");

  const project = mapping.project ?? {};
  const figmaInfo = mapping.figma ?? {};
  const stack = project.stack ?? {};
  const conventions = mapping.conventions ?? {};
  const tokens = mapping.tokens ?? {};

  // --- Project & Figma ---
  const repo = display(project.repository, "⚠️  [TODO: set project.repository in figma-mapping.json]");
  const projectName = display(project.name, "figma-sync-starter");
  const fileUrl = display(
    process.env.FIGMA_FILE_URL || figmaInfo.fileUrl,
    "⚠️  [TODO: set FIGMA_FILE_URL in .env]"
  );

  const envNodeIds = (process.env.FIGMA_NODE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const configFrames = Array.isArray(config.framesInScope) ? config.framesInScope.filter(Boolean) : [];
  const nodeIds =
    envNodeIds.length > 0
      ? envNodeIds.join(", ")
      : configFrames.length > 0
      ? configFrames.join(", ")
      : "⚠️  [TODO: set FIGMA_NODE_IDS in .env or framesInScope in figma/figma.config.json]";

  // --- Stack ---
  const framework = display(stack.framework, "⚠️  [TODO: set project.stack.framework in figma-mapping.json — e.g. Next.js, React, Vue]");
  const language = display(stack.language, "TypeScript");
  const styling = display(stack.styling, "⚠️  [TODO: set project.stack.styling — e.g. Tailwind, CSS Modules, styled-components]");
  const uiLibrary = display(stack.uiLibrary, "none");
  const font = display(conventions.font, null);

  // --- Conventions ---
  const componentNaming = display(conventions.componentNaming, "PascalCase");
  const fileNaming = display(conventions.fileNaming, "kebab-case");
  const defaultBranch = display(conventions.defaultBranch, "main");
  const tokenStrategy = display(conventions.tokenStrategy, "none");

  // --- Token files ---
  const tokenFiles =
    Array.isArray(tokens.files) && tokens.files.length > 0
      ? tokens.files.map((f) => `  - ${f}`).join("\n")
      : "  - (none configured yet — add to tokens.files in figma-mapping.json)";

  // --- Behavior notes ---
  const behaviors = readBehaviorNotes(".prompts/note_behavior");

  const today = new Date().toISOString().slice(0, 10);

  // ---------------------------------------------------------------------------
  // Build the output prompt
  // ---------------------------------------------------------------------------

  const lines = [];

  lines.push(`# AI Init Prompt — ${projectName}`);
  lines.push(`Generated: ${today}`);
  lines.push("");
  lines.push("> **How to use**: Copy this entire file and paste it into your AI assistant (Claude, ChatGPT, GitHub Copilot, etc.).");
  lines.push("> The context section below pre-answers the clarifying questions so the AI can start implementing immediately.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(promptTemplate.trimEnd());
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## ✅ PRE-FILLED CONTEXT");
  lines.push("");
  lines.push("*The following answers are derived from the project configuration. The AI should use these instead of asking clarifying questions.*");
  lines.push("");
  lines.push("### 1. Repository & Figma");
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`| ----- | ----- |`);
  lines.push(`| Repository | \`${repo}\` |`);
  lines.push(`| Figma File URL | ${fileUrl} |`);
  lines.push(`| Node IDs in scope | \`${nodeIds}\` |`);
  lines.push("");
  lines.push("### 2. Stack");
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`| ----- | ----- |`);
  lines.push(`| Framework | ${framework} |`);
  lines.push(`| Language | ${language} |`);
  lines.push(`| Styling | ${styling} |`);
  lines.push(`| Component library | ${uiLibrary} |`);
  if (font) {
    lines.push(`| Font | ${font} |`);
  }
  lines.push("");
  lines.push("### 3. Conventions");
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`| ----- | ----- |`);
  lines.push(`| Component naming | ${componentNaming} |`);
  lines.push(`| File naming | ${fileNaming} |`);
  lines.push(`| Default branch | ${defaultBranch} |`);
  lines.push(`| Token strategy | ${tokenStrategy} |`);
  lines.push("");
  lines.push("### 4. Token files");
  lines.push("");
  lines.push(tokenFiles);
  lines.push("");

  if (behaviors.length > 0) {
    lines.push("### 5. Behavior Notes (from `.prompts/note_behavior/`)");
    lines.push("");
    lines.push("*These describe the latest design-team behavior specifications for each Figma node.*");
    lines.push("");
    for (const { nodeId, latest } of behaviors) {
      lines.push(`#### Node \`${nodeId}\``);
      lines.push("");
      lines.push(latest);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("> **Next step**: The AI should now proceed with the architecture proposal and code output");
  lines.push("> as described in the spec above — without asking the answered questions again.");
  lines.push("");

  const output = lines.join("\n");

  const outDir = "figma/prompts";
  const outPath = `${outDir}/${today}-init-prompt.md`;
  writeFile(outPath, output);

  console.log(`✅ Init prompt written: ${outPath}`);
  console.log(`   → Paste the contents of that file into your AI assistant to start the implementation.`);

  // Warn if there are unfilled TODO items
  const todoCount = (output.match(/⚠️\s+\[TODO/g) ?? []).length;
  if (todoCount > 0) {
    console.warn(`\n⚠️  ${todoCount} field(s) still need to be configured — search for "[TODO" in the output file.`);
  }
}

try {
  main();
} catch (e) {
  console.error("❌ ai:init failed:", e.message);
  process.exit(1);
}
