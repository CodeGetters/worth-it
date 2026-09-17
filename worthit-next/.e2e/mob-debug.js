const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const mob = await browser.newPage();
  await mob.setViewport({ width: 375, height: 812 });
  await mob.goto('http://localhost:3457/soul', { waitUntil: 'networkidle0' });
  const r = await mob.evaluate(() => {
    const wide = [];
    document.querySelectorAll('*').forEach(el => {
      const w = el.scrollWidth;
      if (w > 377 && el.clientWidth > 0) wide.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0,40) || '', w, cw: el.clientWidth });
    });
    return { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, wide: wide.slice(0, 8) };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
