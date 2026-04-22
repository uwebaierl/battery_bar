import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const localHelperPath = path.resolve(__dirname, "_build-card.mjs");
const workspaceHelperPath = findWorkspaceHelperPath(projectRoot);
const helperPath = workspaceHelperPath ?? localHelperPath;
const { runCardBuild } = await import(pathToFileURL(helperPath).href);

await runCardBuild({
  projectRoot,
  banner: "/* Battery Bar - generated file. Do not edit directly. */\n",
  outFile: "battery_bar.js",
  bundleKey: "battery_bar",
});

function findWorkspaceHelperPath(projectRoot) {
  for (const workspaceRoot of workspaceRootCandidates(projectRoot)) {
    const helperPath = path.join(workspaceRoot, "shared", "build_core", "build-card.mjs");
    if (fs.existsSync(helperPath)) {
      return helperPath;
    }
  }
  return null;
}

function workspaceRootCandidates(projectRoot) {
  const candidates = [];
  if (process.env.HA_CUSTOM_CARDS_WORKSPACE) {
    candidates.push(path.resolve(process.env.HA_CUSTOM_CARDS_WORKSPACE));
  }
  candidates.push(path.resolve(projectRoot, "..", "ha_custom_cards_workspace"));
  candidates.push(path.resolve(projectRoot, ".."));

  return [...new Set(candidates)];
}
