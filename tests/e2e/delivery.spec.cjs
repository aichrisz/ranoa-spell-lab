const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

test("standalone delivery embeds its styling and requests no neighboring files", async ({ page }) => {
  await page.context().setOffline(true);
  const url = pathToFileURL(
    path.resolve(__dirname, "../../artifacts/Ranoa-Spell-Lab.html"),
  ).href;
  const failed = [], external = [];
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("request", (r) => {
    if (r.url() !== url && !r.url().startsWith("data:")) external.push(r.url());
  });
  await page.goto(url);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(8, 25, 35)");
  await page.locator("#action").click();
  await page.locator("canvas").focus();
  await page.keyboard.press("t");
  await page.keyboard.press("Space");
  await expect(page.locator("#score")).toHaveText("100");
  expect(failed).toEqual([]);
  expect(external).toEqual([]);
});

test("desktop active arena and all spell selectors fit together", async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1366, 768]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.locator("#action").click();
    await page.locator(".lab").evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
    const canvas = await page.locator("canvas").boundingBox();
    expect(canvas.y).toBeGreaterThanOrEqual(-1);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(height + 1);
    for (const button of await page.locator("[data-spell]").all()) {
      const b = await button.boundingBox();
      expect(b.y).toBeGreaterThanOrEqual(-1);
      expect(b.y + b.height).toBeLessThanOrEqual(height + 1);
    }
  }
});

test("pause shortcuts work after selecting a spell without stealing native Space activation", async ({ page }) => {
  await page.goto("/");
  await page.locator("#action").click();
  for (const key of ["Escape", "p"]) {
    await page.locator('[data-spell="burst"]').click();
    await page.keyboard.press(key);
    await expect(page.locator("#phase")).toHaveText("Dijeda");
    await page.locator("#action").focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#phase")).toHaveText("Berlangsung");
    await expect(page.locator("#casts")).toHaveText("0");
  }
});

test("without JavaScript the page explains the requirement instead of offering a dead Start", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:4184/");
    await expect(page.getByText(/memerlukan JavaScript/i)).toBeVisible();
    await expect(page.locator("#action")).toBeDisabled();
  } finally {
    await context.close();
  }
});
