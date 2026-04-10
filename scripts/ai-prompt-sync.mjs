/**
 * ai-prompt-sync.mjs
 *
 * Assembles a fully pre-filled AI prompt for syncing code after a Figma update.
 * Reads .prompts/sync-figma-update.md, injects the latest diff report, sync plan,
 * figma-mapping.json, and relevant behavior notes so the AI can apply incremental
 * code changes without manual context-gathering.
 *
 * Usage:  yarn ai:sync
 * Output: figma/prompts/<YYYY-MM-DD>-sync-prompt.md  (also printed to stdout)
 *
 * Prerequisites:
 *   yarn figma:export          → figma/exports/<ts>-nodes.json
 *   yarn figma:diff            → figma/reports/<date>-diff.json
 *   yarn figma:sync -- <diff>  → figma/reports/<date>-sync-plan.json
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Return the newest file in `dir` whose name ends with `suffix`, or null. */
function findLatestFile(dir, suffix) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? path.join(dir, files[0].name) : null;
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
      const latestMatch = raw.match(/##\s+Latest\s*\n([\s\S]*?)(?=\n---|\n##\s+History|$)/);
      const latest = latestMatch ? latestMatch[1].trim() : raw.trim();
      return { nodeId, latest };
    })
    .filter((n) => n.latest.length > 0);
}

// ---------------------------------------------------------------------------
// Build change impact table rows
// ---------------------------------------------------------------------------

function impactTable(entries, mapping) {
  if (entries.length === 0) return "  *(none)*";

  const rows = entries.map((n) => {
    const mapEntry = mapping.entries?.find((e) => e.nodeId === n.nodeId);
    const component = mapEntry?.code?.componentName || "*(not mapped)*";
    const filePath = mapEntry?.code?.filePath || "*(not mapped)*";
    const changeTypes = n.changeTypes ? n.changeTypes.join(", ") : "";
    return `| \`${n.nodeId}\` | ${n.nodeName || ""} | ${n.nodeType || ""} | ${changeTypes} | \`${component}\` | \`${filePath}\` |`;
  });

  const header = [
    "| Node ID | Name | Type | Change types | Component | File |",
    "| ------- | ---- | ---- | ------------ | --------- | ---- |",
  ];

  return [...header, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Build files-to-touch list
// ---------------------------------------------------------------------------

function filesToTouchSection(plan, diff, mapping) {
  if (!plan?.filesToTouch && !diff) return "*(no sync plan available — run `yarn figma:sync`)*";

  // Prefer the authoritative sync-plan output; fall back to building from diff
  const items = plan?.filesToTouch ?? [];
  if (items.length === 0) return "*(no files identified — all changes may be unmapped nodes)*";

  const lines = items.map((item) => {
    const status = item.status === "deprecated" ? " ⚠️ deprecated" : "";
    const file = item.filePath ? `\`${item.filePath}\`` : "*(file path not set in mapping)*";
    return `- **${item.componentName || item.nodeId}**${status}  \n  Node: \`${item.nodeId}\`  File: ${file}`;
  });

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const mapping = readJson("figma-mapping.json");
  const config = safeReadJson("figma/figma.config.json", {});
  const promptTemplate = fs.readFileSync(".prompts/sync-figma-update.md", "utf8");

  const reportsDir = config.diff?.outDir ?? "figma/reports";
  const diffPath = findLatestFile(reportsDir, "-diff.json");
  const planPath = findLatestFile(reportsDir, "-sync-plan.json");

  if (!diffPath) {
    throw new Error(
      "No diff report found in " +
        reportsDir +
        ".\n" +
        "Run the full pipeline first:\n" +
        "  yarn figma:export\n" +
        "  yarn figma:diff\n" +
        "  yarn figma:sync -- figma/reports/<date>-diff.json"
    );
  }

  const diff = readJson(diffPath);
  const plan = planPath ? safeReadJson(planPath, null) : null;
  const behaviors = readBehaviorNotes(".prompts/note_behavior");

  const today = new Date().toISOString().slice(0, 10);
  const project = mapping.project ?? {};
  const figmaInfo = mapping.figma ?? {};

  const repo = project.repository || "⚠️  [TODO: set project.repository in figma-mapping.json]";
  const stack = project.stack ?? {};

  // --- Fill in template placeholders ---
  const oldSnap = diff.figma?.oldSnapshotPath ?? figmaInfo.previousSnapshot?.path ?? "[old snapshot]";
  const newSnap = diff.figma?.newSnapshotPath ?? figmaInfo.latestSnapshot?.path ?? "[new snapshot]";

  const filledPrompt = promptTemplate
    .replace(/<owner>\/<repo>/g, repo)
    .replace(/figma\/exports\/<old-date>-nodes\.json/g, oldSnap)
    .replace(/figma\/exports\/<new-date>-nodes\.json/g, newSnap)
    .replace(/Next\.js \+ React \+ TypeScript \+ Tailwind/g, buildStackLabel(stack));

  // Collect changed nodeIds to determine which behavior notes are relevant
  const changedNodeIds = new Set([
    ...(diff.changes?.added ?? []).map((n) => n.nodeId),
    ...(diff.changes?.modified ?? []).map((n) => n.nodeId),
  ]);

  const relevantBehaviors =
    changedNodeIds.size > 0
      ? behaviors.filter((b) => changedNodeIds.has(b.nodeId))
      : behaviors; // if nothing found, include all

  // ---------------------------------------------------------------------------
  // Build output
  // ---------------------------------------------------------------------------

  const lines = [];

  lines.push(`# AI Sync Prompt — ${project.name || "figma-sync"}`);
  lines.push(`Generated: ${today}`);
  lines.push("");
  lines.push("> **How to use**: Copy this entire file and paste it into your AI assistant.");
  lines.push("> All context (diff, mapping, behavior notes) is already embedded — the AI can apply incremental code changes immediately.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(filledPrompt.trimEnd());
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 📊 CHANGE IMPACT REPORT (auto-generated from diff)");
  lines.push("");
  lines.push(`**Diff report**: \`${diffPath}\``);
  if (planPath) lines.push(`**Sync plan**: \`${planPath}\``);
  lines.push("");
  lines.push("### Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`| ------ | ----- |`);
  lines.push(`| Added | ${diff.summary?.added ?? 0} |`);
  lines.push(`| Removed | ${diff.summary?.removed ?? 0} |`);
  lines.push(`| Modified | ${diff.summary?.modified ?? 0} |`);
  lines.push(`| Unchanged | ${diff.summary?.unchanged ?? 0} |`);
  lines.push("");

  if ((diff.changes?.added ?? []).length > 0) {
    lines.push("### ➕ Added nodes");
    lines.push("");
    lines.push(impactTable(diff.changes.added, mapping));
    lines.push("");
  }

  if ((diff.changes?.removed ?? []).length > 0) {
    lines.push("### ➖ Removed nodes (deprecation candidates)");
    lines.push("");
    lines.push(impactTable(diff.changes.removed, mapping));
    lines.push("");
  }

  if ((diff.changes?.modified ?? []).length > 0) {
    lines.push("### ✏️  Modified nodes");
    lines.push("");
    lines.push(impactTable(diff.changes.modified, mapping));
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## 📁 FILES TO TOUCH");
  lines.push("");
  lines.push(filesToTouchSection(plan, diff, mapping));
  lines.push("");
  lines.push("---");
  lines.push("");

  if (relevantBehaviors.length > 0) {
    lines.push("## 📝 BEHAVIOR NOTES (relevant to changed nodes)");
    lines.push("");
    lines.push("*Read the latest section for each node before generating code.*");
    lines.push("");
    for (const { nodeId, latest } of relevantBehaviors) {
      lines.push(`### Node \`${nodeId}\``);
      lines.push("");
      lines.push(latest);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  lines.push("## 🗺️  CURRENT FIGMA MAPPING");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(mapping, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 🔄 FULL DIFF REPORT");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(diff, null, 2));
  lines.push("```");
  lines.push("");

  if (plan) {
    lines.push("---");
    lines.push("");
    lines.push("## 📋 SYNC PLAN");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(plan, null, 2));
    lines.push("```");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("> **AI instruction**: Apply minimal, incremental code changes based on the diff above.");
  lines.push("> Preserve architecture and public component APIs. Update `figma-mapping.json` in the same commit.");
  lines.push("");

  const output = lines.join("\n");

  const outDir = "figma/prompts";
  const outPath = `${outDir}/${today}-sync-prompt.md`;
  writeFile(outPath, output);

  console.log(`✅ Sync prompt written: ${outPath}`);
  console.log(`   → Paste the contents of that file into your AI assistant to apply the Figma updates.`);

  const summary = diff.summary ?? {};
  console.log(`\nChange summary: +${summary.added ?? 0} added, ~${summary.modified ?? 0} modified, -${summary.removed ?? 0} removed`);

  if (relevantBehaviors.length > 0) {
    console.log(`   Behavior notes included: ${relevantBehaviors.map((b) => b.nodeId).join(", ")}`);
  }
}

function buildStackLabel(stack) {
  const parts = [
    stack.framework && stack.framework !== "sync-only" ? stack.framework : null,
    stack.language || null,
    stack.styling && stack.styling !== "n/a" ? stack.styling : null,
    stack.uiLibrary && stack.uiLibrary !== "n/a" ? stack.uiLibrary : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" + ") : "Next.js + React + TypeScript + Tailwind";
}

try {
  main();
} catch (e) {
  console.error("❌ ai:sync failed:", e.message);
  process.exit(1);
}
