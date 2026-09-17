const puppeteer = require('puppeteer');
const BASE = 'https://worthit-next-codegetters.vercel.app';
let pass = 0, fail = 0;
function check(n, c, x){ if (c){ pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x || ''); } }
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.goto(BASE + '/soul', { waitUntil: 'networkidle0', timeout: 90000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const chip = await page.$eval('.soul-chip span', el => el.textContent).catch(() => null);
  check('线上灵魂屏+示例卡', chip === '健身年卡', chip);
  const num1 = await page.$eval('.big-price span', el => el.textContent);
  check('线上示例单价 ¥375.00', num1 === '375.00', num1);

  await page.click('#btn-checkin');
  await new Promise(r => setTimeout(r, 250));
  const fx = await page.$$eval('#fx-layer > *', f => f.length);
  check('线上打卡特效', fx > 0, fx);
  await new Promise(r => setTimeout(r, 700));
  const num2 = await page.$eval('.big-price span', el => el.textContent);
  check('线上滚动终值 ¥333.33', num2 === '333.33', num2);

  await page.click('.theme-seg .seg-btn:nth-of-type(2)');
  await new Promise(r => setTimeout(r, 500));
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('线上主题切换', theme === 'forge', theme);
  await page.screenshot({ path: '.e2e/prod-next-forge.png' });
  await page.click('.theme-seg .seg-btn:first-of-type');
  await new Promise(r => setTimeout(r, 300));

  await page.goto(BASE + '/calc', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.type('#f-p2', '1200'); await page.type('#f-f2', '5'); await page.type('#f-y2', '3');
  await page.click('form button[type="submit"]');
  await new Promise(r => setTimeout(r, 400));
  const verdict = await page.$eval('.panel-line', el => el.textContent);
  check('线上买前计算 值得买', verdict.includes('值得买') && verdict.includes('1.54'), verdict.slice(0, 50));

  const mob = await browser.newPage();
  mob.on('pageerror', e => errors.push('MOBILE:' + String(e)));
  await mob.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await mob.goto(BASE + '/soul', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 500));
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('线上移动端无溢出', overflow <= 2, 'overflow=' + overflow);
  await mob.screenshot({ path: '.e2e/prod-next-mobile.png' });

  check('线上无页面错误', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log('\n==== PROD-NEXT:', pass, 'passed /', fail, 'failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('crashed:', e.message); process.exit(2); });
