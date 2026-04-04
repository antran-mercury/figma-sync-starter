import fs from "node:fs";
import path from "node:path";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function safeReadJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return readJson(p);
  } catch {
    return fallback;
  }
}

function listSnapshots(outDir) {
  if (!fs.existsSync(outDir)) return [];
  return fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith("-nodes.json"))
    .map((f) => {
      const full = path.join(outDir, f);
      const stat = fs.statSync(full);
      return { path: full, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function resolveSnapshotPair({ config, mapping }) {
  // 1) CLI args (debug mode)
  const argOld = process.argv[2];
  const argNew = process.argv[3];
  if (argOld && argNew) return { oldPath: argOld, newPath: argNew, source: "args" };

  // 2) Manifest
  const manifestPath = config.export?.manifestPath ?? "figma/snapshots.json";
  const manifest = safeReadJson(manifestPath, null);
  if (manifest?.previous && manifest?.latest) {
    return { oldPath: manifest.previous, newPath: manifest.latest, source: `manifest:${manifestPath}` };
  }

  // 3) Mapping fallback
  const oldFromMapping = mapping.figma?.previousSnapshot?.path;
  const newFromMapping = mapping.figma?.latestSnapshot?.path;
  if (oldFromMapping && newFromMapping) {
    return { oldPath: oldFromMapping, newPath: newFromMapping, source: "mapping" };
  }

  // 4) Directory fallback: pick 2 newest snapshots
  const outDir = config.export?.outDir ?? "figma/exports";
  const snaps = listSnapshots(outDir);
  if (snaps.length >= 2) {
    return { oldPath: snaps[1].path, newPath: snaps[0].path, source: `dir:${outDir}` };
  }

  throw new Error(
    "Missing snapshot paths. Run yarn figma:export at least twice, or provide args: yarn figma:diff -- <old> <new>."
  );
}

function indexById(snapshot) {
  const m = new Map();
  for (const n of snapshot.nodes) m.set(n.nodeId, n);
  return m;
}

function diffNode(a, b) {
  const changes = [];
  const pick = [
    ["name", a.name, b.name],
    ["pageName", a.pageName, b.pageName],
    ["frameName", a.frameName, b.frameName],
    ["layout.width", a.layout?.width, b.layout?.width],
    ["layout.height", a.layout?.height, b.layout?.height],
    ["style.cornerRadius", a.style?.cornerRadius, b.style?.cornerRadius],
    ["style.opacity", a.style?.opacity, b.style?.opacity],
    ["style.textStyle.fontSize", a.style?.textStyle?.fontSize, b.style?.textStyle?.fontSize],
    ["style.textStyle.fontWeight", a.style?.textStyle?.fontWeight, b.style?.textStyle?.fontWeight],
    ["style.textStyle.lineHeightPx", a.style?.textStyle?.lineHeightPx, b.style?.textStyle?.lineHeightPx]
  ];
  for (const [p, from, to] of pick) {
    if (JSON.stringify(from) !== JSON.stringify(to)) changes.push({ path: p, from: from ?? null, to: to ?? null });
  }

  // Keep fills as coarse "changed" to reduce noise
  if (JSON.stringify(a.style?.fills ?? null) !== JSON.stringify(b.style?.fills ?? null)) {
    changes.push({ path: "style.fills", from: "[changed]", to: "[changed]" });
  }

  return changes;
}

function categorize(fieldsChanged) {
  const s = new Set();
  for (const f of fieldsChanged) {
    if (f.path.startsWith("layout.")) s.add("layout");
    else if (f.path.startsWith("style.")) s.add("style");
    else if (f.path === "name") s.add("content");
  }
  return [...s];
}

async function main() {
  const config = safeReadJson("figma/figma.config.json", {});
  const mapping = readJson("figma-mapping.json");

  const { oldPath, newPath, source } = resolveSnapshotPair({ config, mapping });

  console.log(`ℹ️  Diff source: ${source}`);
  console.log(`ℹ️  OLD snapshot: ${oldPath}`);
  console.log(`ℹ️  NEW snapshot: ${newPath}`);

  const oldSnap = readJson(oldPath);
  const newSnap = readJson(newPath);

  const oldMap = indexById(oldSnap);
  const newMap = indexById(newSnap);

  const added = [];
  const removed = [];
  const modified = [];
  let unchanged = 0;

  for (const [id, nn] of newMap.entries()) {
    const on = oldMap.get(id);
    if (!on) {
      added.push({ nodeId: id, nodeName: nn.name, nodeType: nn.type, pageName: nn.pageName, frameName: nn.frameName });
      continue;
    }
    const fieldsChanged = diffNode(on, nn);
    if (fieldsChanged.length === 0) {
      unchanged++;
      continue;
    }
    modified.push({
      nodeId: id,
      nodeName: nn.name,
      nodeType: nn.type,
      pageName: nn.pageName,
      frameName: nn.frameName,
      changeTypes: categorize(fieldsChanged),
      fieldsChanged
    });
  }

  for (const [id, on] of oldMap.entries()) {
    if (!newMap.has(id)) {
      removed.push({ nodeId: id, nodeName: on.name, nodeType: on.type, pageName: on.pageName, frameName: on.frameName });
    }
  }

  const report = {
    diffVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    figma: {
      fileKey: mapping.figma?.fileKey ?? "",
      oldSnapshotPath: oldPath,
      newSnapshotPath: newPath
    },
    summary: { added: added.length, removed: removed.length, modified: modified.length, unchanged },
    changes: { added, removed, modified },
    tokenChanges: []
  };

  const outDir = config.diff?.outDir ?? "figma/reports";
  const outPath = `${outDir}/${new Date().toISOString().slice(0, 10)}-diff.json`;
  writeJson(outPath, report);

  console.log(`✅ Diff report written: ${outPath}`);
  console.log(report.summary);
}

main().catch((e) => {
  console.error("❌ figma:diff failed:", e.message);
  process.exit(1);
});