/**
 * figma-pipeline.mjs
 *
 * Orchestrates the second half of the Figma sync pipeline after
 * `figma:export` and `figma:diff` have already run:
 *
 *   1. Runs figma:sync with the latest diff report (auto-detected)
 *   2. Runs ai:sync to assemble the pre-filled AI prompt
 *
 * Invoked via:  yarn figma:pipeline
 * (which first runs figma:export and figma:diff, then this script)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function safeReadJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function findLatestFile(dir, suffix) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? path.join(dir, files[0].name) : null;
}

function run(cmd) {
  console.log(`\n▶  ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  const config = safeReadJson("figma/figma.config.json", {});
  const reportsDir = config.diff?.outDir ?? "figma/reports";

  const diffPath = findLatestFile(reportsDir, "-diff.json");
  if (!diffPath) {
    throw new Error(
      "No diff report found in " +
        reportsDir +
        ".\n" +
        "Ensure `yarn figma:export` and `yarn figma:diff` ran successfully."
    );
  }

  console.log(`ℹ️  Using diff report: ${diffPath}`);

  // Step 1: sync mapping
  run(`node scripts/figma-sync.mjs ${diffPath}`);

  // Step 2: assemble AI sync prompt
  run("node scripts/ai-prompt-sync.mjs");
}

try {
  main();
} catch (e) {
  console.error("❌ figma:pipeline failed:", e.message);
  process.exit(1);
}
