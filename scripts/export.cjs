const fs = require("node:fs");
const path = require("node:path");
const { ROOT, safeFile } = require("./public.cjs");
const read = (name) => fs.readFileSync(safeFile(ROOT, name), "utf8");
let html = read("index.html");

// Accept formatting-only changes, but fail loudly on missing/duplicate resources.
// Replacement callbacks preserve literal dollar signs in embedded source code.
function replaceOne(pattern, replacement, label) {
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${label}; found ${matches.length}`);
  }
  html = html.replace(pattern, () => replacement);
}
replaceOne(
  /<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])(?=[^>]*\bhref\s*=\s*["']styles\.css["'])[^>]*\/?>/gi,
  "<style>\n" + read("styles.css") + "\n</style>",
  "styles.css stylesheet link",
);
for (const name of ["engine.js", "renderer.js", "app.js"]) {
  const escaped = name.replaceAll(".", "\\.");
  replaceOne(
    new RegExp(`<script\\b(?=[^>]*\\bsrc\\s*=\\s*["']${escaped}["'])[^>]*>\\s*</script\\s*>`, "gi"),
    "",
    `${name} script tag`,
  );
}
const scripts = ["engine.js", "renderer.js", "app.js"]
  .map(
    (name) =>
      "<script>\n" +
      read(name).replace(/<\/script/gi, "<\\/script") +
      "\n</script>",
  )
  .join("\n");
replaceOne(/<\/body\s*>/gi, scripts + "\n</body>", "closing body tag");
html = html.replaceAll(
  "assets/sigil.svg",
  "data:image/svg+xml;base64," +
    Buffer.from(read("assets/sigil.svg")).toString("base64"),
);
// A standalone delivery must never silently depend on neighboring files or a CDN.
for (const tag of html.match(/<(?:link|script|img)\b[^>]*>/gi) || []) {
  for (const attribute of tag.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    if (!attribute[1].startsWith("data:")) {
      throw new Error(`Unembedded offline resource: ${attribute[1]}`);
    }
  }
}
const dir = path.join(ROOT, "artifacts"),
  out = path.join(dir, "Ranoa-Spell-Lab.html");
if (fs.existsSync(dir) && fs.lstatSync(dir).isSymbolicLink())
  throw new Error("Unsafe output");
fs.mkdirSync(dir, { recursive: true });
if (fs.existsSync(out) && fs.lstatSync(out).isSymbolicLink())
  throw new Error("Unsafe output");
fs.writeFileSync(out, html);
console.log("Offline export: " + out);
