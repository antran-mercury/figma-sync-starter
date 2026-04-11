/**
 * designer-brief.mjs
 *
 * Reads `.prompts/designer-brief.md` (written by the designer) and automatically:
 *   1. Updates `figma-mapping.json`  (project info, figma info, entries)
 *   2. Creates/updates `.prompts/note_behavior/<node-id>.md` behavior files
 *   3. Updates `.env` with FIGMA_FILE_URL and FIGMA_NODE_IDS
 *
 * Usage:  yarn designer:brief
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Helpers (same pattern as other scripts in this repo)
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

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Parse a Figma fileKey from a URL or return the raw value if already a key.
// Supports:  https://www.figma.com/file/<key>/...
//            https://www.figma.com/design/<key>/...
// ---------------------------------------------------------------------------

function parseFileKeyFromUrl(value) {
  if (!value) return "";
  const m = value.match(/figma\.com\/(?:file|design)\/([^/?#]+)/);
  return m ? m[1] : value;
}

// ---------------------------------------------------------------------------
// Parse the designer-brief.md into structured sections
// ---------------------------------------------------------------------------

/**
 * Split the markdown into top-level (##) and behavior (## Behavior:) sections.
 * Returns:
 *   { project, figma, colors, pages, behaviors }
 *
 *   pages    – array of { name, fields: { nodeId, component, file, breakpoint, notes } }
 *   behaviors – array of { nodeId, trigger, behavior, states, animation, notes }
 */
function parseBrief(markdown) {
  // Strip HTML comments so designers can read the template instructions
  const raw = markdown.replace(/<!--[\s\S]*?-->/g, "");

  // Split on top-level ## headings
  const sectionRegex = /^##\s+(.+)$/m;
  const parts = raw.split(/^(?=##\s)/m).filter((s) => s.trim().length > 0);

  const result = {
    project: {},
    figma: {},
    colors: {},
    pages: [],
    behaviors: [],
  };

  for (const part of parts) {
    const headingMatch = part.match(/^##\s+(.+)/);
    if (!headingMatch) continue;
    const heading = headingMatch[1].trim();

    // ── ## Behavior: <node-id> ──────────────────────────────────────────────
    const behaviorMatch = heading.match(/^Behavior:\s*(.+)$/i);
    if (behaviorMatch) {
      const nodeId = behaviorMatch[1].trim();
      result.behaviors.push({ nodeId, ...parseBehaviorSection(part) });
      continue;
    }

    // ── ## Pages ────────────────────────────────────────────────────────────
    if (/^pages$/i.test(heading)) {
      result.pages = parsePagesSection(part);
      continue;
    }

    // ── ## Project ──────────────────────────────────────────────────────────
    if (/^project$/i.test(heading)) {
      result.project = parseKeyValueSection(part);
      continue;
    }

    // ── ## Figma ────────────────────────────────────────────────────────────
    if (/^figma$/i.test(heading)) {
      result.figma = parseKeyValueSection(part);
      continue;
    }

    // ── ## Colors ───────────────────────────────────────────────────────────
    if (/^colors$/i.test(heading)) {
      result.colors = parseKeyValueSection(part);
      continue;
    }
  }

  return result;
}

/** Parse `- Key: Value` lines from a section body into a plain object. */
function parseKeyValueSection(sectionText) {
  const obj = {};
  for (const line of sectionText.split(/\r?\n/)) {
    const m = line.match(/^\s*-\s+([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim();
    if (key && value) obj[key] = value;
  }
  return obj;
}

/**
 * Parse ### subsections inside ## Pages.
 * Each ### heading is a page name; the body is key-value pairs.
 */
function parsePagesSection(sectionText) {
  // Drop the ## Pages heading line itself
  const body = sectionText.replace(/^##\s+Pages\s*/i, "");
  const pages = [];

  const subSections = body.split(/^(?=###\s)/m).filter((s) => s.trim());
  for (const sub of subSections) {
    const nameMatch = sub.match(/^###\s+(.+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    const fields = parseKeyValueSection(sub);
    pages.push({ name, fields });
  }
  return pages;
}

/**
 * Parse the subsections of a ## Behavior: <node-id> section.
 * Returns { trigger, behavior, states, animation, notes }
 */
function parseBehaviorSection(sectionText) {
  // Drop the ## Behavior: heading line
  const body = sectionText.replace(/^##\s+Behavior:[^\n]*\n/, "");

  function extractSubsection(text, ...names) {
    for (const name of names) {
      const re = new RegExp(
        `^###\\s+${name}\\s*\\n([\\s\\S]*?)(?=^###\\s|$)`,
        "im"
      );
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return "";
  }

  return {
    trigger: extractSubsection(body, "Trigger"),
    behavior: extractSubsection(body, "Behavior"),
    states: extractSubsection(body, "States"),
    animation: extractSubsection(body, "Animation", "Animation / Transition"),
    notes: extractSubsection(body, "Notes for AI", "Notes"),
  };
}

// ---------------------------------------------------------------------------
// Update figma-mapping.json
// ---------------------------------------------------------------------------

function updateFigmaMapping(brief, mappingPath) {
  const mapping = safeReadJson(mappingPath, {
    schemaVersion: "1.0.0",
    project: {},
    figma: {},
    conventions: {},
    tokens: {},
    entries: [],
    deprecatedPolicy: {
      neverDeleteEntries: true,
      deprecateInsteadOfDelete: true,
    },
  });

  // ── Project ─────────────────────────────────────────────────────────────
  if (!mapping.project) mapping.project = {};
  if (!mapping.project.stack) mapping.project.stack = {};

  const p = brief.project;
  if (p["Name"]) mapping.project.name = p["Name"];
  if (p["Framework"]) mapping.project.stack.framework = p["Framework"];
  if (p["Language"]) mapping.project.stack.language = p["Language"];
  if (p["Styling"]) mapping.project.stack.styling = p["Styling"];
  if (p["UI Library"]) mapping.project.stack.uiLibrary = p["UI Library"];

  // Store font in conventions if provided
  if (p["Font"]) {
    if (!mapping.conventions) mapping.conventions = {};
    mapping.conventions.font = p["Font"];
  }

  // ── Figma info ───────────────────────────────────────────────────────────
  if (!mapping.figma) mapping.figma = {};

  const f = brief.figma;
  const fileUrl = f["File URL"] ?? "";
  if (fileUrl && fileUrl !== "https://www.figma.com/design/XXXXX/Project-Name") {
    mapping.figma.fileUrl = fileUrl;
    mapping.figma.fileKey = parseFileKeyFromUrl(fileUrl);
  }

  const pagesRaw = f["Pages"] ?? "";
  if (pagesRaw) {
    mapping.figma.pagesInScope = pagesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // ── Colors → tokens ──────────────────────────────────────────────────────
  const colorEntries = Object.entries(brief.colors);
  if (colorEntries.length > 0) {
    if (!mapping.tokens) mapping.tokens = {};
    mapping.tokens.colors = Object.fromEntries(
      colorEntries.map(([name, hex]) => [name.toLowerCase(), hex])
    );
  }

  // ── Entries (pages) ──────────────────────────────────────────────────────
  if (!Array.isArray(mapping.entries)) mapping.entries = [];

  const collectedNodeIds = [];

  for (const page of brief.pages) {
    const { name, fields } = page;
    const nodeId = fields["Node ID"];
    if (!nodeId) continue;

    collectedNodeIds.push(nodeId);

    // Find existing entry by nodeId or create new one
    let entry = mapping.entries.find((e) => e.nodeId === nodeId);
    if (!entry) {
      entry = { nodeId };
      mapping.entries.push(entry);
    }

    entry.nodeName = name;
    entry.nodeType = entry.nodeType ?? "FRAME";
    entry.status = entry.status ?? "active";

    if (!entry.code) entry.code = {};
    if (fields["Component"]) entry.code.componentName = fields["Component"];
    if (fields["File"]) entry.code.filePath = fields["File"];

    // Designer notes
    const hasBreakpoint = Boolean(fields["Breakpoint"]);
    const hasNotes = Boolean(fields["Notes"]);
    if (hasBreakpoint || hasNotes) {
      if (!entry.designerNotes) entry.designerNotes = {};
      if (hasBreakpoint) entry.designerNotes.breakpoint = fields["Breakpoint"];
      if (hasNotes) entry.designerNotes.notes = fields["Notes"];
    }
  }

  // Update framesInScope (merge with existing, no duplicates)
  const existing = Array.isArray(mapping.figma.framesInScope)
    ? mapping.figma.framesInScope
    : [];
  const merged = Array.from(new Set([...existing, ...collectedNodeIds]));
  if (merged.length > 0) mapping.figma.framesInScope = merged;

  writeJson(mappingPath, mapping);
  return { collectedNodeIds };
}

// ---------------------------------------------------------------------------
// Create / update behavior note files
// ---------------------------------------------------------------------------

function updateBehaviorNote(nodeId, behavior, notesDir) {
  // Normalize node id to filename (148:4463 → 148-4463)
  const filename = nodeId.replace(/:/g, "-") + ".md";
  const filePath = path.join(notesDir, filename);
  const fileExists = fs.existsSync(filePath);

  const date = today();
  const changeType = fileExists ? "interaction-update" : "initial";

  const latestBlock = buildLatestBlock(date, changeType, behavior);

  if (!fileExists) {
    const content = [
      `# Behavior: ${nodeId}`,
      "",
      `> Figma Node: \`${nodeId}\``,
      "",
      "---",
      "",
      "## Latest",
      "",
      latestBlock,
      "",
      "---",
      "",
      "## History",
      "",
      "<!-- Previous versions will be moved here -->",
      "",
    ].join("\n");
    writeFile(filePath, content);
    return "created";
  }

  // File already exists → move current Latest → History, write new Latest
  const raw = fs.readFileSync(filePath, "utf8");

  // Split file into segments by known section markers (## Latest, ## History)
  // so we can safely replace Latest and prepend to History.
  const latestIdx = raw.search(/^## Latest\s*$/m);
  const historyIdx = raw.search(/^## History\s*$/m);

  let updatedContent;

  if (latestIdx !== -1 && historyIdx !== -1 && historyIdx > latestIdx) {
    // Everything before ## Latest (header lines, --- divider)
    const beforeLatest = raw.slice(0, latestIdx);

    // Extract old Latest body (between ## Latest and ## History)
    // Find start of content after the ## Latest heading line
    const afterLatestHeading = raw.indexOf("\n", latestIdx) + 1;
    // Find the start of the --- divider or ## History that precedes History
    const dividerBeforeHistory = raw.lastIndexOf("\n---\n", historyIdx);
    const oldLatestEnd =
      dividerBeforeHistory !== -1 && dividerBeforeHistory > latestIdx
        ? dividerBeforeHistory
        : historyIdx;
    const oldLatestBody = raw.slice(afterLatestHeading, oldLatestEnd).trim();

    // Parse metadata from old Latest block
    const dateMatch = oldLatestBody.match(/\*\*Date:\*\*\s*([^\n]+)/);
    const authorMatch = oldLatestBody.match(/\*\*Author:\*\*\s*([^\n]+)/);
    const typeMatch = oldLatestBody.match(/\*\*Change type:\*\*\s*([^\n]+)/);
    const oldDate = dateMatch ? dateMatch[1].trim() : "unknown";
    const oldAuthor = authorMatch ? authorMatch[1].trim() : "@design-team";
    const oldType = typeMatch ? typeMatch[1].trim() : "update";

    // Existing history body (everything after ## History heading line)
    const afterHistoryHeading = raw.indexOf("\n", historyIdx) + 1;
    const existingHistoryBody = raw.slice(afterHistoryHeading).trim();

    const historyEntry = `### v — ${oldDate} | ${oldType} | ${oldAuthor}\n\n${oldLatestBody}`;

    updatedContent = [
      beforeLatest.trimEnd(),
      "",
      "## Latest",
      "",
      latestBlock,
      "",
      "---",
      "",
      "## History",
      "",
      historyEntry,
      "",
      ...(existingHistoryBody ? [existingHistoryBody, ""] : []),
    ].join("\n");
  } else {
    // Fallback: just append a new Latest block at the end
    updatedContent = raw.trimEnd() + "\n\n## Latest\n\n" + latestBlock + "\n";
  }

  writeFile(filePath, updatedContent);
  return "updated";
}

function buildLatestBlock(date, changeType, behavior) {
  const lines = [
    `**Date:** ${date}`,
    `**Author:** @design-team`,
    `**Change type:** ${changeType}`,
    "",
  ];

  if (behavior.trigger) {
    lines.push("### Trigger", "", behavior.trigger, "");
  }
  if (behavior.behavior) {
    lines.push("### Behavior", "", behavior.behavior, "");
  }
  if (behavior.states) {
    lines.push("### States", "", behavior.states, "");
  }
  if (behavior.animation) {
    lines.push("### Animation / Transition", "", behavior.animation, "");
  }
  if (behavior.notes) {
    lines.push("### Notes for AI", "", behavior.notes, "");
  }

  return lines.join("\n").trimEnd();
}

// ---------------------------------------------------------------------------
// Update .env
// ---------------------------------------------------------------------------

function updateEnv(fileUrl, nodeIds, envPath) {
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }

  function setOrAdd(key, value) {
    const lines = content.split(/\r?\n/);
    const idx = lines.findIndex((l) => {
      const trimmed = l.trimStart();
      return trimmed.startsWith(key + "=") || trimmed.startsWith(key + " =");
    });
    if (idx !== -1) {
      lines[idx] = `${key}=${value}`;
      content = lines.join("\n");
    } else {
      content = content.trimEnd() + (content.trim() ? "\n" : "") + `${key}=${value}\n`;
    }
  }

  if (fileUrl) setOrAdd("FIGMA_FILE_URL", fileUrl);
  if (nodeIds.length > 0) setOrAdd("FIGMA_NODE_IDS", nodeIds.join(","));

  fs.writeFileSync(envPath, content, "utf8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  loadEnv();

  const briefPath = ".prompts/designer-brief.md";
  if (!fs.existsSync(briefPath)) {
    throw new Error(
      `Missing ${briefPath} — copy the template from .prompts/designer-brief.md and fill it in.`
    );
  }

  const markdown = fs.readFileSync(briefPath, "utf8");
  const brief = parseBrief(markdown);

  // ── Update figma-mapping.json ────────────────────────────────────────────
  const mappingPath = "figma-mapping.json";
  const { collectedNodeIds } = updateFigmaMapping(brief, mappingPath);

  // ── Create / update behavior note files ─────────────────────────────────
  const notesDir = ".prompts/note_behavior";
  const behaviorResults = [];
  for (const beh of brief.behaviors) {
    const action = updateBehaviorNote(beh.nodeId, beh, notesDir);
    behaviorResults.push({ nodeId: beh.nodeId, action });
  }

  // ── Update .env ──────────────────────────────────────────────────────────
  const fileUrl = brief.figma["File URL"] ?? "";
  const isPlaceholderUrl =
    !fileUrl || fileUrl === "https://www.figma.com/design/XXXXX/Project-Name";

  const envPath = ".env";
  if (!fs.existsSync(envPath) && fs.existsSync(".env.example")) {
    fs.copyFileSync(".env.example", envPath);
  }

  if (!isPlaceholderUrl || collectedNodeIds.length > 0) {
    updateEnv(
      isPlaceholderUrl ? "" : fileUrl,
      collectedNodeIds,
      envPath
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ designer:brief — update complete\n");

  console.log(`  figma-mapping.json`);
  if (brief.project["Name"]) {
    console.log(`    project.name           → ${brief.project["Name"]}`);
  }
  if (brief.project["Framework"]) {
    console.log(`    project.stack          → ${brief.project["Framework"]} / ${brief.project["Language"] ?? "?"} / ${brief.project["Styling"] ?? "?"}`);
  }
  if (!isPlaceholderUrl) {
    console.log(`    figma.fileUrl          → ${fileUrl}`);
  }
  if (collectedNodeIds.length > 0) {
    console.log(`    entries added/updated  → ${collectedNodeIds.length} page(s): ${collectedNodeIds.join(", ")}`);
  }

  if (behaviorResults.length > 0) {
    console.log(`\n  .prompts/note_behavior/`);
    for (const { nodeId, action } of behaviorResults) {
      const filename = nodeId.replace(/:/g, "-") + ".md";
      console.log(`    ${action.padEnd(8)} ${filename}`);
    }
  }

  if (!isPlaceholderUrl || collectedNodeIds.length > 0) {
    console.log(`\n  .env`);
    if (!isPlaceholderUrl) console.log(`    FIGMA_FILE_URL         → updated`);
    if (collectedNodeIds.length > 0) {
      console.log(`    FIGMA_NODE_IDS         → ${collectedNodeIds.join(",")}`);
    }
  }

  console.log(`\n  Next steps:`);
  console.log(`    yarn ai:init   → generate the AI prompt`);
  console.log(`    (then paste the output into your AI assistant)\n`);
}

try {
  main();
} catch (e) {
  console.error("❌ designer:brief failed:", e.message);
  process.exit(1);
}
