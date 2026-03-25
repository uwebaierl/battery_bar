import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const workspaceHelperPath = path.resolve(projectRoot, "..", "shared", "build_core", "build-card.mjs");
const localHelperPath = path.resolve(__dirname, "_build-card.mjs");
const helperPath = fs.existsSync(workspaceHelperPath) ? workspaceHelperPath : localHelperPath;
const { runCardBuild } = await import(pathToFileURL(helperPath).href);

await runCardBuild({
  projectRoot,
  banner: "/* Battery Bar - generated file. Do not edit directly. */\n",
  outFile: "battery_bar.js",
  bundleKey: "battery_bar",
});
