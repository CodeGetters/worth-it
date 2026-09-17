const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3457/soul', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500)); // 等光柱淡入+气泡上升
  await page.screenshot({ path: '.e2e/v9-dive-ambient.png' });
  await page.click('.theme-seg .seg-btn:nth-of-type(2)');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: '.e2e/v9-forge-ambient.png' });
  await browser.close();
  console.log('done');
})();
