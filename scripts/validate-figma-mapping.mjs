import fs from "node:fs";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const mappingPath = process.argv[2];
  if (!mappingPath) throw new Error("Usage: yarn figma:mapping:validate -- figma-mapping.json");

  const mapping = readJson(mappingPath);
  if (!mapping.schemaVersion) throw new Error("schemaVersion is required");
  if (!Array.isArray(mapping.entries)) throw new Error("entries must be an array");

  const seen = new Set();
  for (const e of mapping.entries) {
    if (!e.nodeId) throw new Error("Each entry must have nodeId");
    if (seen.has(e.nodeId)) throw new Error(`Duplicate nodeId: ${e.nodeId}`);
    seen.add(e.nodeId);

    if (e.code !== undefined && e.code !== null) {
      if (e.code.selectors !== undefined) {
        if (!Array.isArray(e.code.selectors)) {
          throw new Error(`code.selectors must be an array (nodeId: ${e.nodeId})`);
        }
        for (const sel of e.code.selectors) {
          if (typeof sel !== "string" || sel.trim() === "") {
            throw new Error(`code.selectors must contain non-empty strings (nodeId: ${e.nodeId})`);
          }
        }
      }
    }
  }

  console.log(`✅ Mapping valid: ${mappingPath} (entries=${mapping.entries.length})`);
}

main();