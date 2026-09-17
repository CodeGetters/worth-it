const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const mob = await browser.newPage();
  await mob.setViewport({ width: 375, height: 812 });
  await mob.goto('https://worthit-next-codegetters.vercel.app/soul', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const r = await mob.evaluate(() => {
    const wide = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > 377 || rect.left < -2) {
        if (rect.width > 20) wide.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0, 30), left: Math.round(rect.left), right: Math.round(rect.right) });
      }
    });
    return { scrollW: document.documentElement.scrollWidth, wide: wide.slice(0, 10) };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
