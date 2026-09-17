const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.setViewport({ width: 1440, height: 960 });
  await page.goto('http://localhost:3457/soul', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const st = await page.evaluate(() => ({
    hasChip: !!document.querySelector('.soul-chip'),
    hasBigPrice: !!document.querySelector('.big-price'),
    bodyText: document.body.innerText.slice(0, 200),
    dataTheme: document.documentElement.getAttribute('data-theme'),
  }));
  console.log(JSON.stringify(st, null, 1));
  console.log('errors:', errors.slice(0, 3).join(' | ') || 'none');
  await browser.close();
})();
