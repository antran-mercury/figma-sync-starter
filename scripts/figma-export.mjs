import fs from "node:fs";
import path from "node:path";

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

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

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

function flattenNodes(documentNode) {
  const includeTypes = new Set(["FRAME", "COMPONENT", "COMPONENT_SET", "INSTANCE", "TEXT"]);
  const out = [];

  function walk(node, ctx) {
    let pageName = ctx.pageName;
    let frameName = ctx.frameName;

    if (node.type === "CANVAS") pageName = node.name;
    if (node.type === "FRAME") frameName = node.name;

    if (includeTypes.has(node.type)) {
      out.push({
        nodeId: node.id,
        name: node.name,
        type: node.type,
        pageName: pageName || "",
        frameName: frameName || "",
        layout: {
          width: node.absoluteBoundingBox?.width ?? null,
          height: node.absoluteBoundingBox?.height ?? null
        },
        style: {
          cornerRadius: node.cornerRadius ?? null,
          opacity: node.opacity ?? null,
          fills: node.fills ?? null,
          strokes: node.strokes ?? null,
          textStyle: node.style
            ? {
                fontFamily: node.style.fontFamily ?? null,
                fontSize: node.style.fontSize ?? null,
                fontWeight: node.style.fontWeight ?? null,
                lineHeightPx: node.style.lineHeightPx ?? null,
                letterSpacing: node.style.letterSpacing ?? null
              }
            : null
        },
        meta: {
          componentId: node.componentId ?? null,
          componentPropertyReferences: node.componentPropertyReferences ?? null
        }
      });
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child, { pageName, frameName });
    }
  }

  walk(documentNode, { pageName: "", frameName: "" });
  return out;
}

function updateSnapshotManifest({ manifestPath, newSnapshotPath }) {
  const today = new Date().toISOString().slice(0, 10);
  const manifest = safeReadJson(manifestPath, { previous: "", latest: "", history: [] });

  const prevLatest = manifest.latest || "";

  manifest.previous = prevLatest;
  manifest.latest = newSnapshotPath;

  manifest.history = Array.isArray(manifest.history) ? manifest.history : [];
  manifest.history.push({
    date: today,
    previous: prevLatest,
    latest: newSnapshotPath
  });

  writeJson(manifestPath, manifest);
  return { previous: manifest.previous, latest: manifest.latest };
}

async function main() {
  loadEnv();

  const token = process.env.FIGMA_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;
  if (!token) throw new Error("Missing FIGMA_TOKEN in .env");
  if (!fileKey) throw new Error("Missing FIGMA_FILE_KEY in .env");

  const configPath = "figma/figma.config.json";
  const config = fs.existsSync(configPath) ? readJson(configPath) : {};

  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": token }
  });
  if (!res.ok) throw new Error(`Figma API error ${res.status}: ${await res.text()}`);

  const figmaFile = await res.json();

  const snapshot = {
    snapshotVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    figma: {
      fileKey,
      framesInScope: config.framesInScope ?? []
    },
    nodes: flattenNodes(figmaFile.document)
  };

  const outDir = config.export?.outDir ?? "figma/exports";
  const outPath = `${outDir}/${stamp()}-nodes.json`;
  writeJson(outPath, snapshot);

  // Update mapping snapshot pointers (kept for backwards compatibility)
  const mappingPath = config.mapping?.path ?? "figma-mapping.json";
  const mapping = readJson(mappingPath);

  const prevLatest = mapping.figma?.latestSnapshot ?? { date: "", path: "" };
  mapping.figma = mapping.figma || {};
  mapping.figma.fileKey = fileKey;
  mapping.figma.fileUrl = mapping.figma.fileUrl || `https://www.figma.com/file/${fileKey}`;
  mapping.figma.previousSnapshot = { date: prevLatest.date || "", path: prevLatest.path || "" };
  mapping.figma.latestSnapshot = {
    date: new Date().toISOString().slice(0, 10),
    path: outPath,
    exporter: "figma-api",
    notes: ""
  };
  writeJson(mappingPath, mapping);

  // Update snapshot manifest (enterprise pin)
  const manifestPath = config.export?.manifestPath ?? "figma/snapshots.json";
  const pinned = updateSnapshotManifest({ manifestPath, newSnapshotPath: outPath });

  console.log(`✅ Exported snapshot: ${outPath}`);
  console.log(`✅ Updated mapping latestSnapshot: ${mappingPath}`);
  console.log(`✅ Updated manifest: ${manifestPath}`);
  console.log(`   previous=${pinned.previous || "(empty)"}`);
  console.log(`   latest=${pinned.latest}`);
}

main().catch((e) => {
  console.error("❌ figma:export failed:", e.message);
  process.exit(1);
});