const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT, FILES, safeFile } = require("./public.cjs");
for (const name of FILES) safeFile(ROOT, name);
const files = [
  "engine.js",
  "renderer.js",
  "app.js",
  "playwright.config.cjs",
  ...fs
    .readdirSync(path.join(ROOT, "scripts"))
    .filter((n) => n.endsWith(".cjs"))
    .map((n) => "scripts/" + n),
];
for (const name of files) {
  const r = spawnSync(process.execPath, ["--check", path.join(ROOT, name)], {
    stdio: "inherit",
  });
  if (r.status) process.exit(r.status);
}
console.log(
  "Syntax and public boundary checks passed: " +
    files.length +
    " JavaScript files.",
);
