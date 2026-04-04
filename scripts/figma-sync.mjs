import fs from "node:fs";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function ensureEntry(mapping, nodeLike) {
  const existing = mapping.entries.find((e) => e.nodeId === nodeLike.nodeId);
  if (existing) return existing;

  const entry = {
    nodeId: nodeLike.nodeId,
    status: "active",
    node: {
      name: nodeLike.nodeName || "",
      type: nodeLike.nodeType || "",
      pageName: nodeLike.pageName || "",
      frameName: nodeLike.frameName || "",
      lastSeenInSnapshotDate: new Date().toISOString().slice(0, 10)
    },
    code: { componentName: "", filePath: "" },
    api: { props: [], events: [], slots: [], a11y: {} },
    design: { kind: "unknown", variants: [], states: [], tokensUsed: {}, layoutNotes: "" },
    history: [],
    notes: ""
  };

  mapping.entries.push(entry);
  return entry;
}

function main() {
  const diffPath = process.argv[2];
  if (!diffPath) {
    throw new Error("Usage: yarn figma:sync -- figma/reports/<YYYY-MM-DD>-diff.json");
  }

  const today = new Date().toISOString().slice(0, 10);
  const mappingPath = "figma-mapping.json";
  const mapping = readJson(mappingPath);
  const diff = readJson(diffPath);

  const added = diff.changes?.added ?? [];
  const removed = diff.changes?.removed ?? [];
  const modified = diff.changes?.modified ?? [];

  const summary = { added: [], updated: [], deprecated: [] };

  for (const n of added) {
    const e = ensureEntry(mapping, n);
    e.history.push({ date: today, changeType: "created", summary: "Auto-added from diff." });
    summary.added.push(n.nodeId);
  }

  for (const n of modified) {
    const e = ensureEntry(mapping, n);
    const before = JSON.stringify(e.node);

    e.node.name = n.nodeName ?? e.node.name;
    e.node.type = n.nodeType ?? e.node.type;
    e.node.pageName = n.pageName ?? e.node.pageName;
    e.node.frameName = n.frameName ?? e.node.frameName;
    e.node.lastSeenInSnapshotDate = today;

    if (JSON.stringify(e.node) !== before) {
      e.history.push({ date: today, changeType: "updated", summary: "Updated node metadata from diff." });
      summary.updated.push(n.nodeId);
    }
  }

  for (const n of removed) {
    const e = mapping.entries.find((x) => x.nodeId === n.nodeId);
    if (!e) continue;
    if (e.status !== "deprecated") {
      e.status = "deprecated";
      e.deprecatedAt = today;
      e.history.push({ date: today, changeType: "deprecated", summary: "NodeId removed from latest snapshot." });
      summary.deprecated.push(n.nodeId);
    }
  }

  // Keep snapshot pointers aligned with diff report
  mapping.figma = mapping.figma || {};
  mapping.figma.previousSnapshot = {
    date: mapping.figma.latestSnapshot?.date ?? "",
    path: mapping.figma.latestSnapshot?.path ?? ""
  };
  mapping.figma.latestSnapshot = {
    date: today,
    path: diff.figma?.newSnapshotPath ?? mapping.figma.latestSnapshot?.path ?? "",
    exporter: mapping.figma.latestSnapshot?.exporter ?? "figma-api",
    notes: "Updated by figma:sync"
  };

  writeJson(mappingPath, mapping);

  const plan = {
    generatedAt: new Date().toISOString(),
    diffPath,
    summary: diff.summary,
    mappingUpdateSummary: summary,
    filesToTouch: []
  };

  // For sync-only repo, we just output nodeId -> filePath (if set)
  const changedIds = new Set([...added, ...modified, ...removed].map((x) => x.nodeId));
  for (const nodeId of changedIds) {
    const e = mapping.entries.find((x) => x.nodeId === nodeId);
    if (!e) continue;
    plan.filesToTouch.push({
      nodeId,
      status: e.status,
      componentName: e.code?.componentName ?? "",
      filePath: e.code?.filePath ?? ""
    });
  }

  const planPath = `figma/reports/${today}-sync-plan.json`;
  writeJson(planPath, plan);

  console.log(`✅ Updated mapping: ${mappingPath}`);
  console.log(`✅ Wrote sync plan: ${planPath}`);
  console.log("Mapping update summary:", summary);
}

try {
  main();
} catch (e) {
  console.error("❌ figma:sync failed:", e.message);
  process.exit(1);
}