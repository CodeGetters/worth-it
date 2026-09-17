const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3457/soul', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  // 捕捉入场动画中间帧
  await page.screenshot({ path: '.e2e/motion-home.png' });
  // 打卡瞬间（涟漪+气泡+滚动）
  await page.click('#btn-checkin');
  await new Promise(r => setTimeout(r, 180));
  await page.screenshot({ path: '.e2e/motion-burst.png' });
  await browser.close();
  console.log('done');
})();
