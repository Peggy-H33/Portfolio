const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const project = path.resolve(__dirname, '..');
const qaDir = path.join(project, 'qa');
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:4182';
fs.mkdirSync(qaDir, { recursive: true });

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}

async function warmLazyMedia(page) {
  await page.evaluate(async () => {
    const step = Math.max(320, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(650);
}

async function collect(page, viewport) {
  return page.evaluate(({ viewport }) => {
    const rangeRects = (element) => {
      const rects = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode(node) { return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
      });
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) rects.push(rect.width);
      }
      return rects;
    };
    const ids = ['brand-mark','hero-title','manifesto-quote','timeline-afternoon-title','stay-one-title','stay-two-title','stay-two-quote','stay-three-title','stay-three-caption','selector-title','final-title','footer-brand','dialog-title'];
    const displayMetrics = Object.fromEntries(ids.map((id) => {
      const el = document.querySelector(`[data-type-surface="${id}"]`);
      if (!el) return [id, null];
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const widths = rangeRects(el);
      const longest = Math.max(0, ...widths);
      return [id, {
        viewport_width_px: viewport,
        available_width_px: Math.round(rect.width * 10) / 10,
        longest_line_width_px: Math.round(longest * 10) / 10,
        ratio: rect.width ? Math.round((longest / rect.width) * 1000) / 1000 : 0,
        font_family: style.fontFamily,
        font_size: style.fontSize,
        line_height: style.lineHeight,
        lines: Math.max(1, Math.round(rect.height / parseFloat(style.lineHeight || style.fontSize)))
      }];
    }));
    const surfaces = [...document.querySelectorAll('[data-type-surface]')].map((el) => el.dataset.typeSurface);
    return {
      viewport,
      fontsReady: document.documentElement.dataset.fontsReady,
      surfaceCount: surfaces.length,
      uniqueSurfaceCount: new Set(surfaces).size,
      horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      heroMediaCoverage: (() => { const hero = document.querySelector('.hero').getBoundingClientRect(); const media = document.querySelector('.hero-media').getBoundingClientRect(); return Math.round((media.width * media.height) / (hero.width * hero.height) * 1000) / 1000; })(),
      displayMetrics
    };
  }, { viewport });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox', '--disable-gpu'] });
  const report = { generatedAt: new Date().toISOString(), baseUrl, consoleErrors: [], captures: {}, metrics: {}, interactions: {} };

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on('console', (msg) => { if (msg.type() === 'error') report.consoleErrors.push(msg.text()); });
  desktop.on('pageerror', (err) => report.consoleErrors.push(err.message));
  await desktop.goto(baseUrl);
  await settle(desktop);
  report.metrics.desktop = await collect(desktop, 1440);
  await desktop.locator('.motion-toggle').click();
  await desktop.waitForTimeout(250);
  report.interactions.globalMotionToggle = await desktop.evaluate(() => ({
    state: document.documentElement.dataset.motion,
    pressed: document.querySelector('.motion-toggle')?.getAttribute('aria-pressed'),
    allVideosPaused: [...document.querySelectorAll('[data-video-shell]')].every((shell) => shell.dataset.playing === 'false')
  }));
  await desktop.locator('.motion-toggle').click();
  await desktop.locator('[data-stay="ritual"]').click();
  report.interactions.selector = await desktop.locator('#stay-detail h3').textContent();
  await desktop.locator('[data-stay="river"]').click();
  await desktop.locator('.nav-inquiry').click();
  await desktop.locator('[data-inquiry-form] input[name="name"]').fill('林小姐');
  await desktop.locator('[data-inquiry-form] button[type="submit"]').click();
  report.interactions.dialogSubmit = await desktop.locator('[data-dialog-status]').textContent();
  await desktop.locator('[data-close-dialog]').click();
  await desktop.screenshot({ path: path.join(qaDir, 'hero-playing-desktop.png') });
  report.captures.heroPlayingDesktop = 'qa/hero-playing-desktop.png';
  await desktop.evaluate(() => document.querySelectorAll('[data-video-shell]').forEach((el) => el.dataset.playing = 'false'));
  await desktop.screenshot({ path: path.join(qaDir, 'hero-poster-desktop.png') });
  report.captures.heroPosterDesktop = 'qa/hero-poster-desktop.png';
  await warmLazyMedia(desktop);
  await desktop.evaluate(() => { document.activeElement?.blur(); document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')); });
  await desktop.waitForTimeout(1000);
  await desktop.screenshot({ path: path.join(qaDir, 'fullpage-desktop.png'), fullPage: true });
  report.captures.fullpageDesktop = 'qa/fullpage-desktop.png';
  for (const [name, selector] of [['manifesto','.manifesto'],['river','.river-stay'],['lane','.lane-stay'],['ritual','.ritual-stay'],['choose','.choose'],['final','.final-cta']]) {
    const section = desktop.locator(selector);
    await section.scrollIntoViewIfNeeded();
    await desktop.waitForTimeout(900);
    await desktop.evaluate(() => document.activeElement?.blur());
    await section.screenshot({ path: path.join(qaDir, `${name}-desktop.png`) });
  }

  const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await tablet.goto(baseUrl); await settle(tablet);
  report.metrics.tablet = await collect(tablet, 768);
  await tablet.screenshot({ path: path.join(qaDir, 'hero-tablet.png') });
  await tablet.locator('.lane-stay').screenshot({ path: path.join(qaDir, 'lane-tablet.png') });

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(baseUrl); await settle(phone);
  report.metrics.phone = await collect(phone, 390);
  await phone.screenshot({ path: path.join(qaDir, 'hero-phone.png') });
  await phone.evaluate(() => document.querySelector('[data-menu-toggle]').click());
  await phone.waitForTimeout(500);
  await phone.screenshot({ path: path.join(qaDir, 'menu-phone.png') });
  await phone.evaluate(() => document.querySelector('[data-menu-toggle]').click());
  await phone.waitForTimeout(500);
  await warmLazyMedia(phone);
  await phone.evaluate(() => { document.activeElement?.blur(); document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')); });
  await phone.waitForTimeout(1000);
  await phone.screenshot({ path: path.join(qaDir, 'fullpage-phone.png'), fullPage: true });
  for (const [name, selector] of [['river','.river-stay'],['lane','.lane-stay'],['ritual','.ritual-stay']]) {
    const section = phone.locator(selector);
    await section.scrollIntoViewIfNeeded();
    await phone.waitForTimeout(900);
    await section.screenshot({ path: path.join(qaDir, `${name}-phone.png`) });
  }

  const reduced = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await reduced.goto(baseUrl); await settle(reduced);
  await reduced.screenshot({ path: path.join(qaDir, 'reduced-motion-default.png') });
  await reduced.evaluate(() => document.querySelector('[data-video-toggle]').click());
  await reduced.waitForTimeout(700);
  await reduced.screenshot({ path: path.join(qaDir, 'reduced-motion-explicit-play.png') });

  const zoom = await browser.newPage({ viewport: { width: 720, height: 900 } });
  await zoom.goto(baseUrl); await settle(zoom);
  await zoom.evaluate(() => { document.body.style.zoom = '2'; });
  await zoom.screenshot({ path: path.join(qaDir, 'zoom-200.png') });

  const fallback = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await fallback.goto(baseUrl); await settle(fallback);
  await fallback.evaluate(() => {
    document.documentElement.style.setProperty('--type-display', '"Songti SC", serif');
    document.documentElement.style.setProperty('--type-script', '"Kaiti SC", cursive');
    document.documentElement.style.setProperty('--type-reading', '"Songti SC", serif');
    document.documentElement.dataset.fontFailure = 'simulated';
  });
  await fallback.screenshot({ path: path.join(qaDir, 'font-fallback-desktop.png') });

  fs.writeFileSync(path.join(qaDir, 'metrics.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
