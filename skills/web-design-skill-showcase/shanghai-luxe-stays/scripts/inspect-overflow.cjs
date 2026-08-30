const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox','--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:4182');
  await page.waitForLoadState('networkidle');
  const result = await page.evaluate(() => ({
    innerWidth,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: window.visualViewport?.width,
    scrollWidth: document.documentElement.scrollWidth,
    topLevel: [...document.body.children].map((el) => ({ tag: el.tagName, cls: el.className || '', id: el.id || '', width: Math.round(el.getBoundingClientRect().width), scrollWidth: el.scrollWidth })),
    offenders: [...document.querySelectorAll('body *')].map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, cls: el.className || '', id: el.id || '', surface: el.dataset?.typeSurface || '', left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), scrollWidth: el.scrollWidth };
    }).filter((x) => x.right > innerWidth + 1 || x.left < -1).sort((a,b) => b.right-a.right).slice(0,30)
  }));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
