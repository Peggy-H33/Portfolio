"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const SITE_URL = process.env.PORTFOLIO_URL || "http://127.0.0.1:4173/";
const CHROME_PATH = process.env.CHROME_PATH || "";
const ARTIFACTS_DIR = path.join(__dirname, "artifacts");

async function waitForSnapshot(page, predicate) {
  await page.waitForFunction(predicate, undefined, { timeout: 30_000 });
  return page.evaluate(() => window.__portfolioDebug.snapshot());
}

async function wheelUntilTransition(page, deltaY) {
  for (let gesture = 0; gesture < 80; gesture += 1) {
    if (await page.evaluate(() => window.__portfolioDebug.snapshot().transitioning)) {
      return;
    }

    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(12);
  }

  throw new Error("The page boundary did not start a section transition.");
}

async function run() {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const launchOptions = { headless: true };

  if (CHROME_PATH) {
    launchOptions.executablePath = CHROME_PATH;
  }

  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2,
    });
    const errors = [];

    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(`console: ${message.text()}`);
      }
    });

    await page.addInitScript(() => {
      window.__canvasDraws = [];
      const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;

      CanvasRenderingContext2D.prototype.drawImage = function wrappedDrawImage(...args) {
        if (args.length === 9) {
          window.__canvasDraws.push({
            dx: args[5],
            dy: args[6],
            dw: args[7],
            dh: args[8],
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
          });
        }

        return originalDrawImage.apply(this, args);
      };
    });

    await page.goto(SITE_URL, { waitUntil: "domcontentloaded" });
    let snapshot = await waitForSnapshot(
      page,
      () => window.__portfolioDebug?.snapshot().drawnFrame === 1,
    );

    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        vastShadow: document.fonts.check('48px "Vast Shadow"'),
        novaMono: document.fonts.check('24px "NovaMono"'),
      };
    });

    assert.deepEqual(fonts, { vastShadow: true, novaMono: true });
    assert.equal(snapshot.page, 0);
    assert.equal(snapshot.frame, 1);
    assert.equal(await page.locator("h1").textContent(), "PORTFOLIO");
    assert.equal(await page.locator("h1").isVisible(), true);
    assert.equal(await page.locator(".site-header").textContent(), "\n      Peijing Han\n    ");
    assert.equal(await page.locator(".site-header > *").count(), 1);
    assert.equal(await page.locator(".frame-readout").count(), 0);
    assert.equal(await page.locator(".panel--intro").innerText(), "PORTFOLIO");
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "page-1.png") });

    const canvasMetrics = await page.locator("#frame-canvas").evaluate((canvas) => {
      const rect = canvas.getBoundingClientRect();
      return {
        cssWidth: rect.width,
        cssHeight: rect.height,
        bitmapWidth: canvas.width,
        bitmapHeight: canvas.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        ratio: window.devicePixelRatio,
      };
    });

    assert.equal(canvasMetrics.cssWidth, canvasMetrics.viewportWidth);
    assert.equal(canvasMetrics.cssHeight, canvasMetrics.viewportHeight);
    assert.equal(canvasMetrics.bitmapWidth, Math.round(canvasMetrics.viewportWidth * canvasMetrics.ratio));
    assert.equal(canvasMetrics.bitmapHeight, Math.round(canvasMetrics.viewportHeight * canvasMetrics.ratio));

    await wheelUntilTransition(page, 126);
    snapshot = await page.evaluate(() => window.__portfolioDebug.snapshot());
    assert.equal(snapshot.page, 0);
    assert.equal(snapshot.frame, 300);
    assert.equal(snapshot.cardsVisible, false);
    assert.equal(await page.locator("h1").isVisible(), true);

    snapshot = await waitForSnapshot(
      page,
      () => {
        const value = window.__portfolioDebug.snapshot();
        return value.page === 0 && value.drawnFrame === 300 && value.transitioning === true;
      },
    );
    assert.equal(await page.locator("h1").isVisible(), true);

    snapshot = await waitForSnapshot(
      page,
      () => {
        const value = window.__portfolioDebug.snapshot();
        return value.page === 1 && value.frame === 301 && value.transitioning === false;
      },
    );
    assert.ok(Math.abs(snapshot.scrollY - 720) <= 1);
    assert.equal(snapshot.cardsVisible, true);

    await page.waitForFunction(
      () => Number.parseFloat(getComputedStyle(document.querySelector(".card-grid")).opacity) > 0.98,
    );
    await page.waitForFunction(() => {
      const rect = document.querySelector(".card-grid").getBoundingClientRect();
      return Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) <= 1;
    });

    const cardTitles = await page.locator(".glass-card h2").allTextContents();
    assert.deepEqual(cardTitles, ["For anyone", "For recruits", "For myself"]);

    const glassStyle = await page.locator(".glass-card").first().evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        backgroundImage: style.backgroundImage,
        borderRadius: Number.parseFloat(style.borderRadius),
      };
    });

    assert.match(glassStyle.backdropFilter, /blur\(/);
    assert.notEqual(glassStyle.backgroundImage, "none");
    assert.ok(glassStyle.borderRadius >= 20);

    const cardLayout = await page.locator(".card-grid").evaluate((grid) => {
      const gridRect = grid.getBoundingClientRect();
      const cardRects = Array.from(grid.querySelectorAll(".glass-card"), (card) => {
        const rect = card.getBoundingClientRect();
        return { top: rect.top, height: rect.height };
      });

      return {
        gridCenterY: gridRect.top + gridRect.height / 2,
        viewportCenterY: window.innerHeight / 2,
        cardRects,
      };
    });

    const cardTops = cardLayout.cardRects.map(({ top }) => top);
    const cardHeights = cardLayout.cardRects.map(({ height }) => height);
    assert.ok(Math.max(...cardTops) - Math.min(...cardTops) <= 1);
    assert.ok(Math.max(...cardHeights) - Math.min(...cardHeights) <= 1);
    assert.ok(Math.abs(cardLayout.gridCenterY - cardLayout.viewportCenterY) <= 1);

    await page.locator(".glass-card").nth(1).hover();
    const hoveredCardTops = await page.locator(".glass-card").evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().top),
    );
    assert.ok(Math.max(...hoveredCardTops) - Math.min(...hoveredCardTops) <= 1);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "page-2.png") });

    await page.mouse.wheel(0, -126);
    snapshot = await waitForSnapshot(
      page,
      () => {
        const value = window.__portfolioDebug.snapshot();
        return value.page === 0 && value.frame === 300 && value.transitioning === false;
      },
    );
    assert.equal(snapshot.scrollY, 0);
    assert.equal(snapshot.cardsVisible, false);
    assert.equal(await page.locator("h1").isVisible(), true);

    await page.mouse.wheel(0, 126);
    await waitForSnapshot(
      page,
      () => {
        const value = window.__portfolioDebug.snapshot();
        return value.page === 1 && value.frame === 301 && value.transitioning === false;
      },
    );

    while ((await page.evaluate(() => window.__portfolioDebug.snapshot().frame)) < 600) {
      await page.mouse.wheel(0, 126);
      await page.waitForTimeout(12);
    }

    snapshot = await waitForSnapshot(
      page,
      () => window.__portfolioDebug.snapshot().drawnFrame === 600,
    );
    assert.equal(snapshot.page, 1);
    assert.equal(snapshot.frame, 600);
    assert.ok(snapshot.cacheSize <= 4);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "page-2-end.png") });

    const draw = await page.evaluate(() => window.__canvasDraws.at(-1));
    assert.ok(draw);
    assert.ok([draw.dx, draw.dy, draw.dw, draw.dh].every(Number.isInteger));
    assert.ok(draw.dw >= draw.canvasWidth);
    assert.ok(draw.dh >= draw.canvasHeight);
    assert.deepEqual(errors, []);

    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobileErrors = [];

    mobilePage.on("pageerror", (error) => mobileErrors.push(`pageerror: ${error.message}`));
    mobilePage.on("console", (message) => {
      if (message.type() === "error") {
        mobileErrors.push(`console: ${message.text()}`);
      }
    });

    await mobilePage.goto(SITE_URL, { waitUntil: "domcontentloaded" });
    await waitForSnapshot(
      mobilePage,
      () => window.__portfolioDebug?.snapshot().drawnFrame === 1,
    );

    const mobileLayout = await mobilePage.evaluate(() => {
      const titleRect = document.querySelector("#portfolio-title").getBoundingClientRect();

      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        titleLeft: titleRect.left,
        titleRight: titleRect.right,
        cardColumns: getComputedStyle(document.querySelector(".card-grid")).gridTemplateColumns,
      };
    });

    assert.equal(mobileLayout.viewportWidth, 390);
    assert.ok(mobileLayout.documentWidth <= mobileLayout.viewportWidth);
    assert.ok(mobileLayout.bodyWidth <= mobileLayout.viewportWidth);
    assert.ok(mobileLayout.titleLeft >= -1);
    assert.ok(mobileLayout.titleRight <= mobileLayout.viewportWidth + 1);
    assert.ok(!mobileLayout.cardColumns.includes(" "));
    assert.deepEqual(mobileErrors, []);
    await mobilePage.close();

    console.log("Portfolio browser interaction and glass-card tests passed.");
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
