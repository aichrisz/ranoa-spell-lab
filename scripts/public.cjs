const path = require("node:path");
const fs = require("node:fs");
const ROOT = path.resolve(__dirname, "..");
const FILES = [
  "index.html",
  "styles.css",
  "engine.js",
  "renderer.js",
  "app.js",
  "assets/sigil.svg",
];
function safeFile(base, name) {
  if (!FILES.includes(name)) throw new Error("Not public");
  let part = base;
  if (fs.lstatSync(base).isSymbolicLink()) throw new Error("Symlink");
  for (const segment of name.split("/")) {
    part = path.join(part, segment);
    if (fs.lstatSync(part).isSymbolicLink()) throw new Error("Symlink");
  }
  return part;
}
module.exports = { ROOT, FILES, safeFile };
