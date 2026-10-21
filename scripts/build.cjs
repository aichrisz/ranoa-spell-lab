const fs = require("node:fs");
const path = require("node:path");
const { ROOT, FILES, safeFile } = require("./public.cjs");
const out = path.join(ROOT, "dist");
if (fs.existsSync(out) && fs.lstatSync(out).isSymbolicLink())
  throw new Error("Unsafe output");
fs.mkdirSync(out, { recursive: true });
for (const name of FILES) {
  const source = safeFile(ROOT, name),
    target = path.join(out, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (
    fs.lstatSync(path.dirname(target)).isSymbolicLink() ||
    (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink())
  )
    throw new Error("Unsafe output");
  fs.writeFileSync(target, fs.readFileSync(source));
}
console.log("Built 6 allowlisted runtime files in " + out);
