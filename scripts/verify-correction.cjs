// Bounded correction checks beyond the unchanged parent regression suites.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { pathToFileURL } = require("node:url");
const { chromium } = require("@playwright/test");
const ROOT = path.resolve(__dirname, "..");
const exportPath = path.join(__dirname, "export.cjs");
const realRequire = createRequire(exportPath);
const original = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const exporter = fs.readFileSync(exportPath, "utf8");
const link = /<link\b[^>]*rel="stylesheet"[^>]*>/;
function runExport(input) {
  let output;
  const mockFS = Object.create(fs);
  mockFS.readFileSync = (file, ...args) => path.resolve(file) === path.join(ROOT, "index.html")
    ? input : fs.readFileSync(file, ...args);
  mockFS.writeFileSync = (file, contents) => { output = contents; };
  mockFS.mkdirSync = () => {};
  vm.runInNewContext(exporter, {
    require: name => name === "node:fs" ? mockFS : realRequire(name),
    Buffer, console: { log() {} },
  });
  return output;
}
for (const tag of [
  '<link rel="stylesheet" href="styles.css">',
  '<link rel="stylesheet" href="styles.css" />',
  "<link\n href = 'styles.css'\n rel = 'stylesheet'\n/>",
]) {
  const output = runExport(original.replace(link, tag));
  assert.ok(output.includes("<style>"));
  assert.ok(!/<link\b[^>]*styles\.css/.test(output));
}
assert.throws(() => runExport(original.replace(link, "")), /exactly one.*found 0/);
assert.throws(() => runExport(original.replace(link, match => match + match)), /exactly one.*found 2/);
console.log("Exporter: three link formatting variants embedded; missing/duplicate links rejected.");

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/root/.hermes/tools/chromium-1208/chrome-linux/chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.clock.install({ time: new Date("2026-10-22T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-22T00:00:01Z"));
    const url = pathToFileURL(path.join(ROOT, "index.html")).href;
    for (const [width, height] of [[320, 900], [390, 900], [768, 1000], [1024, 768], [1440, 900], [1366, 768]]) {
      await page.setViewportSize({ width, height });
      await page.goto(url);
      async function geometry(state) {
        const overlay = await page.locator("#overlay").boundingBox();
        const inner = await page.locator(".overlay-inner").boundingBox();
        assert.ok(inner.x >= overlay.x - 1 && inner.y >= overlay.y - 1, `${width} ${state}: leading edge`);
        assert.ok(inner.x + inner.width <= overlay.x + overlay.width + 1, `${width} ${state}: horizontal clipping`);
        assert.ok(inner.y + inner.height <= overlay.y + overlay.height + 1, `${width} ${state}: vertical clipping`);
        const canvas = await page.locator("canvas").boundingBox();
        assert.ok(Math.abs(canvas.width / canvas.height - 900 / 560) < .001, `${width} ${state}: world ratio`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await geometry("ready");
      await page.locator("#action").click();
      await page.keyboard.press("p");
      await geometry("paused");
      await page.locator("#action").click();
      await page.clock.runFor(50);
      await page.clock.fastForward(61000);
      assert.equal(await page.locator("#phase").textContent(), "Selesai");
      await geometry("results");
      console.log(`${width}x${height} DPR2: ready/paused/results contained, no overflow, world ratio intact.`);
    }
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
