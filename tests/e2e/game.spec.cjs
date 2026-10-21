const { test, expect } = require("@playwright/test");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const axe = require.resolve("axe-core/axe.min.js");
async function start(page, url = "/") {
  await page.goto(url);
  await page.getByRole("button", { name: "Mulai ujian" }).click();
  await expect(page.locator("#phase")).toHaveText("Berlangsung");
}
async function aimCast(page, key = "1") {
  await page.locator("canvas").focus();
  await page.keyboard.press(key);
  await page.keyboard.press("t");
  await page.keyboard.press("Space");
}
async function audit(page) {
  // axe uses timers internally; briefly resume the browser clock for its scan.
  await page.clock.resume();
  await page.addScriptTag({ path: axe });
  const violations = await page.evaluate(
    async () =>
      (
        await axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
          },
        })
      ).violations,
  );
  expect(violations).toEqual([]);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 1000)));
}
test("real keyboard play, all spells, pause, results, replay and records", async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-22T00:00:01Z'));
  await page.goto("/");
  await audit(page);
  await page.getByRole("button", { name: "Mulai ujian" }).click();
  await aimCast(page);
  await expect(page.locator("#score")).toHaveText("100");
  await page.clock.runFor(200);
  await aimCast(page, "3");
  await expect(page.locator("#feedback")).toContainText("Dibekukan");
  await page.clock.runFor(200);
  await aimCast(page, "2");
  await expect(page.locator("#casts")).toHaveText("3");
  await audit(page);
  await page.keyboard.press("p");
  await expect(page.locator("#phase")).toHaveText("Dijeda");
  const time = await page.locator("#time").textContent();
  const mana = await page.locator("#mana").textContent();
  await page.clock.runFor(5000);
  await expect(page.locator("#time")).toHaveText(time);
  await expect(page.locator("#mana")).toHaveText(mana);
  await audit(page);
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  await page.clock.runFor(50);
  await page.clock.fastForward(61000);
  await expect(page.locator("#phase")).toHaveText("Selesai");
  await audit(page);
  const record = await page.locator("#record").textContent();
  expect(Number(record)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Ulangi ujian" }).click();
  await expect(page.locator("#score")).toHaveText("0");
  await expect(page.locator("#casts")).toHaveText("0");
  await page.reload();
  await expect(page.locator("#record")).toHaveText(record);
});
test("responsive pointer mapping, non-primary/cancelled gestures and screenshots", async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-22T00:00:01Z'));
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: `artifacts/${width === 390 ? "mobile" : "desktop"}-ready.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Mulai ujian" }).click();
    await page.clock.runFor(1);
    await page.locator("canvas").focus();
    await page.keyboard.press("t");
    const text = await page.locator("#aim").textContent();
    const [x, y] = text.match(/[\d.]+/g).map(Number);
    const box = await page.locator("canvas").boundingBox();
    const px = box.x + (x / 900) * box.width,
      py = box.y + (y / 560) * box.height;
    await page.mouse.click(px, py, { button: "right" });
    await expect(page.locator("#casts")).toHaveText("0");
    await page.locator("canvas").dispatchEvent("pointercancel");
    await page.mouse.click(px, py);
    await expect(page.locator("#score")).toHaveText("100");
    await page.clock.runFor(250);
    await page.mouse.click(box.x + 3, box.y + 3);
    await expect(page.locator("#accuracy")).toHaveText("50%");
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: `artifacts/${width === 390 ? "mobile" : "desktop"}-playing.png`,
        fullPage: true,
      });
  }
});
test("visibility requires explicit resume; reduced motion retains movement; storage survives damage", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-22T00:00:01Z'));
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("ranoa.spell-lab.record.v1", "{broken"),
  );
  await page.reload();
  await expect(page.locator("#record")).toHaveText("0");
  await page.getByRole("button", { name: "Mulai ujian" }).click();
  await page.keyboard.press("t");
  const a = await page.locator("#aim").textContent();
  await page.clock.runFor(1000);
  await page.keyboard.press("t");
  expect(await page.locator("#aim").textContent()).not.toBe(a);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#phase")).toHaveText("Dijeda");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#phase")).toHaveText("Dijeda");
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator("#phase")).toHaveText("Dijeda");
});
test("denied storage and native buttons still work", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("denied");
      },
    });
  });
  await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-22T00:00:01Z'));
  await start(page);
  await aimCast(page);
  await page.clock.runFor(50);
  await page.clock.fastForward(61000);
  await expect(page.locator("#phase")).toHaveText("Selesai");
  await page.getByRole("button", { name: "Ulangi ujian" }).focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#casts")).toHaveText("0");
});
test("DPR2 real pointer after live resize, cancellation and active motion", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4184",
    deviceScaleFactor: 2,
    viewport: { width: 390, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-22T00:00:01Z'));
  await start(page);
  await expect(page.locator("#effects")).not.toBeChecked();
  await page.clock.runFor(20);
  const before = await page.locator("canvas").screenshot();
  await page.clock.runFor(500);
  const after = await page.locator("canvas").screenshot();
  expect(before.equals(after)).toBe(false);
  for (const width of [390, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator("canvas").focus();
    await page.keyboard.press("t");
    const [x, y] = (await page.locator("#aim").textContent())
      .match(/[\d.]+/g)
      .map(Number);
    const box = await page.locator("canvas").boundingBox();
    const px = box.x + (x / 900) * box.width,
      py = box.y + (y / 560) * box.height;
    const old = Number(await page.locator("#casts").textContent());
    await page.mouse.move(px, py);
    await page.mouse.down();
    await page.locator("canvas").dispatchEvent("pointercancel");
    await page.mouse.up();
    await expect(page.locator("#casts")).toHaveText(String(old));
    await page.mouse.move(px, py);
    await page.mouse.down();
    await page.mouse.move(box.x - 5, box.y - 5);
    await page.mouse.up();
    await expect(page.locator("#casts")).toHaveText(String(old));
    await page.mouse.click(px, py);
    await expect(page.locator("#casts")).toHaveText(String(old + 1));
    await expect(page.locator("#accuracy")).toHaveText("100%");
    await page.clock.runFor(200);
  }
  await page.keyboard.press("p");
  const frozen = await page.locator("canvas").screenshot();
  await page.clock.runFor(2000);
  expect(frozen.equals(await page.locator("canvas").screenshot())).toBe(true);
  await context.close();
});
test("cooldown and mana rejections do not count casts; storage validation and public boundary", async ({
  page,
  request,
}) => {
  await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-22T00:00:01Z'));
  await start(page);
  await page.locator("canvas").focus();
  await page.keyboard.press("2");
  await page.keyboard.press("Space");
  await page.keyboard.press("Space");
  await expect(page.locator("#casts")).toHaveText("1");
  await expect(page.locator("#feedback")).toContainText("pulih");
  for (let i = 0; i < 4; i++) {
    await page.clock.runFor(660);
    await page.keyboard.press("Space");
  }
  await page.clock.runFor(660);
  const casts = await page.locator("#casts").textContent();
  await page.keyboard.press("Space");
  await expect(page.locator("#feedback")).toContainText("Mana belum cukup");
  await expect(page.locator("#casts")).toHaveText(casts);
  for (const value of [
    '{"version":1,"score":-2}',
    '{"version":1,"score":1e999}',
    '{"version":2,"score":100}',
    '{"version":1,"score":"<img>"}',
  ]) {
    await page.evaluate(
      (v) => localStorage.setItem("ranoa.spell-lab.record.v1", v),
      value,
    );
    await page.reload();
    await expect(page.locator("#record")).toHaveText("0");
  }
  for (const url of [
    "/.git/config",
    "/package.json",
    "/docs/tdd-evidence.md",
    "/%2e%2e/package.json",
    "/dist/../package.json",
  ])
    expect((await request.get(url)).status()).toBe(404);
});
for (const [label, url] of [
  ["dist", "/dist/index.html"],
  [
    "offline",
    pathToFileURL(
      path.resolve(__dirname, "../../artifacts/Ranoa-Spell-Lab.html"),
    ).href,
  ],
  [
    "source-file",
    pathToFileURL(path.resolve(__dirname, "../../index.html")).href,
  ],
]) {
  test(`${label} actually plays offline-capable`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    if (label !== "dist") await page.context().setOffline(true);
    await start(page, url);
    await aimCast(page);
    await expect(page.locator("#score")).toHaveText("100");
    await page.keyboard.press("p");
    await expect(page.locator("#phase")).toHaveText("Dijeda");
    expect(errors).toEqual([]);
  });
}
