const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT, safeFile } = require("./public.cjs");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
};
const server = http.createServer((req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) throw new Error("Method");
    let name = decodeURIComponent(
      new URL(req.url, "http://127.0.0.1").pathname,
    ).slice(1);
    let base = ROOT;
    if (name.startsWith("dist/")) {
      base = path.join(ROOT, "dist");
      name = name.slice(5);
    }
    const file = safeFile(base, name || "index.html");
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : fs.readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(4184, "127.0.0.1", () =>
  console.log("Ranoa: http://127.0.0.1:4184"),
);
