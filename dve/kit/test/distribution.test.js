import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const kitDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("packed CLI installs and runs outside the source tree", () => {
  const root = mkdtempSync(path.join(tmpdir(), "dve-pack-"));
  const packDir = path.join(root, "pack");
  const consumerDir = path.join(root, "consumer");
  mkdirSync(packDir);
  mkdirSync(consumerDir);

  const packed = JSON.parse(execFileSync("npm", ["pack", "--json", "--pack-destination", packDir], {
    cwd: kitDir,
    encoding: "utf8",
  }));
  const tarball = path.join(packDir, packed[0].filename);
  const paths = new Set(packed[0].files.map((file) => file.path));

  assert(paths.has("dist/cli/dve-tool.js"));
  assert(paths.has("dist/graph/builder.js"));
  assert(paths.has("dist/parser/session-parser.js"));
  assert(!paths.has("cli/dve-tool.ts"));

  writeFileSync(path.join(consumerDir, "package.json"), '{"private":true}\n');
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
    cwd: consumerDir,
    stdio: "pipe",
  });
  const output = execFileSync(path.join(consumerDir, "node_modules", ".bin", "dve"), ["version"], {
    cwd: consumerDir,
    encoding: "utf8",
  });
  assert.equal(output.trim(), "DVE toolkit v4.2.0");
});

test("installer fails closed when compilation fails", () => {
  const root = mkdtempSync(path.join(tmpdir(), "dve-install-compile-"));
  const sourceDir = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const binDir = path.join(root, "bin");
  mkdirSync(sourceDir);
  mkdirSync(targetDir);
  mkdirSync(binDir);
  cpSync(path.join(kitDir, "install.sh"), path.join(sourceDir, "install.sh"));
  writeFileSync(path.join(sourceDir, "version.txt"), "4.2.0\n");
  writeFileSync(path.join(sourceDir, "package.json"), '{"scripts":{"build":"exit 17"}}\n');
  writeFileSync(path.join(binDir, "npm"), "#!/bin/sh\nexit 17\n");
  chmodSync(path.join(binDir, "npm"), 0o755);

  const result = spawnSync("bash", [path.join(sourceDir, "install.sh"), targetDir], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
  });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout, /installed\./);
});

test("installer propagates initial graph build failure", () => {
  const root = mkdtempSync(path.join(tmpdir(), "dve-install-graph-"));
  const sourceDir = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const cliDir = path.join(sourceDir, "dist", "cli");
  mkdirSync(cliDir, { recursive: true });
  mkdirSync(targetDir);
  cpSync(path.join(kitDir, "install.sh"), path.join(sourceDir, "install.sh"));
  writeFileSync(path.join(sourceDir, "version.txt"), "4.2.0\n");
  writeFileSync(path.join(cliDir, "dve-tool.js"), "process.exit(23);\n");

  const result = spawnSync("bash", [path.join(sourceDir, "install.sh"), targetDir], { encoding: "utf8" });
  assert.equal(result.status, 23);
  assert.doesNotMatch(result.stdout, /installed\./);
});

test("updater propagates graph rebuild failure", () => {
  const root = mkdtempSync(path.join(tmpdir(), "dve-update-graph-"));
  const sourceDir = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const cliDir = path.join(sourceDir, "dist", "cli");
  mkdirSync(cliDir, { recursive: true });
  mkdirSync(path.join(targetDir, "dve", "kit"), { recursive: true });
  cpSync(path.join(kitDir, "update.sh"), path.join(sourceDir, "update.sh"));
  writeFileSync(path.join(sourceDir, "version.txt"), "4.2.0\n");
  writeFileSync(path.join(targetDir, "dve", "kit", "version.txt"), "4.1.0\n");
  writeFileSync(path.join(cliDir, "dve-tool.js"), "process.exit(29);\n");

  const result = spawnSync("bash", [path.join(sourceDir, "update.sh"), targetDir], { encoding: "utf8" });
  assert.equal(result.status, 29);
  assert.doesNotMatch(result.stdout, /Updated to/);
});

test("CI does not suppress workspace build failures", () => {
  const workflow = readFileSync(path.resolve(kitDir, "..", "..", ".github", "workflows", "ci.yml"), "utf8");
  assert.match(workflow, /npm run build --workspace="\$ws"/);
  assert.doesNotMatch(workflow, /npm run build --workspace="\$ws"\s*\|\|\s*true/);
});
