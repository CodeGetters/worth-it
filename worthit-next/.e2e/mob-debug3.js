const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const mob = await browser.newPage();
  await mob.setViewport({ width: 375, height: 812 });
  await mob.goto('https://worthit-next-codegetters.vercel.app/soul', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const r = await mob.evaluate(() => {
    const amb = document.querySelector('.ambient');
    const cs = amb ? getComputedStyle(amb) : null;
    const ray = document.querySelector('.ray.r2');
    return {
      ambOverflow: cs ? cs.overflow + '/' + cs.contain : 'none',
      rayParent: ray ? ray.parentElement.className : null,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      htmlOverflowX: getComputedStyle(document.documentElement).overflowX,
      scrollW: document.documentElement.scrollWidth,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
