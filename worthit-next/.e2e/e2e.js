const puppeteer = require('puppeteer');
const BASE = 'http://localhost:3457';
let pass = 0, fail = 0;
function check(n, c, x){ if (c){ pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x || ''); } }
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.goto(BASE + '/soul', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  // 1. 灵魂屏 + 示例卡
  const soulOn = await page.$eval('#view-soul, section[aria-label="打卡"]', el => el !== null);
  check('灵魂屏路由加载', soulOn);
  await new Promise(r => setTimeout(r, 500));
  const chip = await page.$eval('.soul-chip span', el => el.textContent);
  check('示例卡自动就位', chip === '健身年卡', chip);
  const num1 = await page.$eval('#big-num, .big-price span', el => el.textContent);
  check('示例单价 ¥375.00', num1 === '375.00', num1);

  // 2. 打卡 → 滚动 → ¥333.33 + 特效
  await page.click('#btn-checkin');
  await new Promise(r => setTimeout(r, 250));
  const fx = await page.$$eval('#fx-layer > *', f => f.length);
  check('打卡特效发射', fx > 0, fx);
  await new Promise(r => setTimeout(r, 800));
  const num2 = await page.$eval('.big-price span', el => el.textContent);
  check('滚动终值 ¥333.33', num2 === '333.33', num2);
  const eq = await page.$eval('.soul-eq', el => el.textContent);
  check('水深叙事', /水深\s*\d+m/.test(eq), eq);

  // 3. 里程碑翻转（注入 125 次）
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('worthit.cards.v2'));
    raw.state.cards[0].checkins = Array.from({length: 125}, (_, i) => Date.now() - (125 - i) * 86400000 * 0.5);
    localStorage.setItem('worthit.cards.v2', JSON.stringify(raw));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  const eq2 = await page.$eval('.soul-eq', el => el.textContent);
  check('里程碑正向叙事', eq2.includes('白赚') && eq2.includes('累计'), eq2);
  const more = await page.$eval('.record-strip .more', el => el.textContent).catch(() => null);
  check('记录条 +N 标注', more !== null && more.startsWith('+'), more);
  await page.screenshot({ path: '.e2e/next-dive-ms.png' });

  // 4. 冶炼主题切换（zustand 持久化）
  await page.click('.seg-btn:nth-of-type(2)');
  await new Promise(r => setTimeout(r, 500));
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('切换到冶炼', theme === 'forge', theme);
  const btnTxt = await page.$eval('#btn-checkin', el => el.textContent);
  check('冶炼按钮文案', btnTxt.includes('打一锤'), btnTxt);
  await page.screenshot({ path: '.e2e/next-forge-ms.png' });
  await page.click('.theme-seg .seg-btn:first-of-type');
  await new Promise(r => setTimeout(r, 300));

  // 5. 添加有限次课包
  await page.goto(BASE + '/add', { waitUntil: 'networkidle0' });
  await page.type('#f-cname', '私教课包');
  await page.select('#f-ctype', 'limited');
  await new Promise(r => setTimeout(r, 200));
  const totalVisible = await page.$eval('#f-ctotal', el => el.offsetParent !== null);
  check('课包总次数字段出现', totalVisible);
  // 受控组件：用原生 setter 直接赋值 + input 事件（绕过默认值拼接）
  const setNative = async (sel, val) => {
    await page.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, sel, val);
  };
  await setNative('#f-cprice', '2000');
  await setNative('#f-cmental', '80');
  await setNative('#f-cmonths', '6');
  await setNative('#f-ctotal', '20');
  await page.click('form button[type="submit"]');
  await new Promise(r => setTimeout(r, 600));
  const dbg = await page.evaluate(() => ({
    url: location.pathname,
    errs: [...document.querySelectorAll('.err')].map(e => e.textContent),
    formVals: {
      name: document.getElementById('f-cname')?.value,
      price: document.getElementById('f-cprice')?.value,
      months: document.getElementById('f-cmonths')?.value,
      total: document.getElementById('f-ctotal')?.value,
      type: document.getElementById('f-ctype')?.value,
    }
  }));
  console.log('DBG submit:', JSON.stringify(dbg));
  check('开卡后跳转灵魂屏', page.url().includes('/soul'));
  const chip2 = await page.$eval('.soul-chip span', el => el.textContent);
  check('新卡为当前卡', chip2 === '私教课包', chip2);

  // 6. 总览 2 张卡
  await page.goto(BASE + '/overview', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  const ovCards = await page.$$eval('.ov-card', c => c.length);
  check('总览 2 张卡', ovCards === 2, ovCards);
  await page.screenshot({ path: '.e2e/next-overview.png' });

  // 7. 刷新持久化（zustand persist）
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  const ovCards2 = await page.$$eval('.ov-card', c => c.length);
  check('刷新后仍 2 张卡', ovCards2 === 2, ovCards2);

  // 8. 买前算一笔
  await page.goto(BASE + '/calc', { waitUntil: 'networkidle0' });
  await page.type('#f-p2', '1200'); await page.type('#f-f2', '5'); await page.type('#f-y2', '3');
  await page.click('form button[type="submit"]');
  await new Promise(r => setTimeout(r, 400));
  const verdict = await page.$eval('.panel-line', el => el.textContent);
  check('买前计算 值得买 ¥1.54', verdict.includes('值得买') && verdict.includes('1.54'), verdict.slice(0, 60));

  // 9. 异常输入
  await page.goto(BASE + '/calc', { waitUntil: 'networkidle0' });
  await page.type('#f-p2', '-9'); await page.type('#f-f2', '5'); await page.type('#f-y2', '3');
  await page.click('form button[type="submit"]');
  await new Promise(r => setTimeout(r, 300));
  const hasErr = await page.$eval('.err', el => el.textContent.includes('大于 0'));
  check('负价格被拦截', hasErr);

  // 10. 移动端
  const mob = await browser.newPage();
  mob.on('pageerror', e => errors.push('MOBILE:' + String(e)));
  await mob.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await mob.goto(BASE + '/soul', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('移动端无横向溢出', overflow <= 2, 'overflow=' + overflow);
  await mob.screenshot({ path: '.e2e/next-mobile.png' });

  check('无页面错误', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log('\n==== NEXT-E2E:', pass, 'passed /', fail, 'failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('crashed:', e.message); process.exit(2); });
