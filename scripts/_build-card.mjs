import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export async function runCardBuild(options) {
  const {
    projectRoot,
    banner,
    outFile,
    bundleKey,
  } = options;

  const srcRoot = path.join(projectRoot, "src");
  const distRoot = path.join(projectRoot, "dist");
  const workspaceSharedRoot = path.resolve(projectRoot, "..", "shared", "card_core");
  const localSharedRoot = path.join(srcRoot, "_shared");
  const localTestScript = path.resolve(projectRoot, "..", "local_test", "build-test-bundles.mjs");
  const entryFile = path.join(srcRoot, "index.js");
  const visited = new Set();
  const orderedFiles = [];

  syncSharedCore(workspaceSharedRoot, localSharedRoot);
  visit(entryFile, visited, orderedFiles);

  const body = orderedFiles.map((file) => transformFile(projectRoot, file)).join("\n\n");
  const output = `${banner}${body}\n`;

  fs.mkdirSync(distRoot, { recursive: true });
  fs.writeFileSync(path.join(distRoot, outFile), output, "utf8");
  syncLocalTestBundle(localTestScript, projectRoot, bundleKey);

  console.log(`Built dist/${outFile} from ${orderedFiles.length} source files.`);
}

function syncSharedCore(workspaceSharedRoot, localSharedRoot) {
  if (!fs.existsSync(workspaceSharedRoot)) {
    return;
  }
  copyDirectory(workspaceSharedRoot, localSharedRoot);
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function syncLocalTestBundle(localTestScript, projectRoot, bundleKey) {
  if (!fs.existsSync(localTestScript)) {
    return;
  }

  const result = spawnSync(process.execPath, [localTestScript, bundleKey], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Failed to update local_test bundle for ${bundleKey}.`);
  }
}

function visit(file, visited, orderedFiles) {
  const resolved = resolveFile(file);
  if (visited.has(resolved)) {
    return;
  }
  visited.add(resolved);

  const content = fs.readFileSync(resolved, "utf8");
  const imports = findImports(content);
  for (const specifier of imports) {
    if (!specifier.startsWith(".")) {
      throw new Error(`Only relative imports are supported in this build: ${specifier}`);
    }
    visit(path.resolve(path.dirname(resolved), specifier), visited, orderedFiles);
  }
  orderedFiles.push(resolved);
}

function resolveFile(file) {
  if (fs.existsSync(file)) {
    return file;
  }
  if (fs.existsSync(`${file}.js`)) {
    return `${file}.js`;
  }
  throw new Error(`Cannot resolve file: ${file}`);
}

function findImports(content) {
  const result = [];
  const regex = /^\s*import\s+[^'"]*['"]([^'"]+)['"]\s*;?\s*$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    result.push(match[1]);
  }
  return result;
}

function transformFile(projectRoot, file) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/^\s*import\s+[^;]+;?\s*$/gm, "");
  content = content.replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, "");
  content = content.replace(/\bexport\s+(?=(class|function|const|let|var)\b)/g, "");

  const rel = path.relative(projectRoot, file);
  return `/* ${rel} */\n${content.trim()}`;
}
