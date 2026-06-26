/* ============================================================
   打卡灵魂屏 · 交互原型逻辑
   说明:这里的计算是 packages/core 的预演——纯函数、不碰时间。
   核心:真实单次成本 = 总价 / 你实际去的次数。
        每去一次,分母变大,单价就往下掉。不限次卡没有"终点",
        数字会一直降下去。心理价只是一条横向参照线(贵 or 省)。
   ============================================================ */

// ---- 卡片配置(健身年卡 · 不限次) ----
const CARD = {
  total: 2000,    // 办卡总价
  worth: 150,     // 你心里"一次值多少钱"(用户自填,仅作参照,不是终点)
  start: 8,       // demo 起点:已去 8 次
  unlimited: true,
};
// 参照里程碑:去到几次,单次成本才低于你心里价(total/worth)。
// 注意:这不是"回本通关",过了之后单价还会继续往下掉。
const GOOD_DEAL_AT = Math.ceil(CARD.total / CARD.worth);  // = 14 次

// ---- 纯计算(core 预演) ----
function truePrice(n) {
  if (n <= 0) return CARD.total;          // 没去过 / 除零兜底:等于把整张卡的钱花在 0 次上
  return Math.round(CARD.total / n);
}

// ---- 状态 ----
let count = CARD.start;
let prevPrice = truePrice(count);
let breakDays = 0;       // 断卡天数(>0 时进入负反馈)

// ---- DOM ----
const $ = (id) => document.getElementById(id);
const el = {
  price: $('price'), priceVal: $('price-val'), priceLabel: $('price-label'),
  delta: $('delta'), deltaText: $('delta-text'), hint: $('hint'),
  count: $('count'), togo: $('togo'), bar: $('bar'),
  checkin: $('checkin'), undo: $('undo'), toast: $('toast'),
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- 数字滚动动画(灵魂):从 a 滚到 b,等宽字不抖位 ----
function rollNumber(from, to, duration = 650) {
  if (reduceMotion || from === to) { el.priceVal.textContent = to; return; }
  const t0 = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);   // ease-out cubic
  function frame(now) {
    const p = Math.min(1, (now - t0) / duration);
    const v = Math.round(from + (to - from) * ease(p));
    el.priceVal.textContent = v;
    if (p < 1) requestAnimationFrame(frame);
    else el.priceVal.textContent = to;
  }
  requestAnimationFrame(frame);
}

// ---- 渲染(不含价格滚动,价格由 rollNumber 单独驱动) ----
function render(opts = {}) {
  const price = truePrice(count);
  const goodDeal = price <= CARD.worth;   // 是否已比心里价划算

  // 去过几次
  el.count.textContent = `已去 ${count} 次`;

  // 单价 vs 心理价:用进度条表达"这一次相对心理价是贵还是省"
  // 条满 = 单价已降到心理价(及以下)。注意这只是参照,不是终点。
  const ratio = Math.min(1, CARD.worth / price);   // price 越低,ratio 越接近 1
  el.bar.style.width = (ratio * 100) + '%';
  el.bar.classList.toggle('done', goodDeal);

  // 参照文案
  if (goodDeal) {
    el.togo.textContent = '已比心里价划算';
    el.togo.style.color = 'var(--c-save)';
  } else {
    el.togo.textContent = `再去 ${GOOD_DEAL_AT - count} 次就低于心里价`;
    el.togo.style.color = 'var(--c-warn)';
  }

  // 断卡负反馈:不去 = 单价卡住不降,且"摊到每天"在涨
  if (breakDays > 0) {
    el.price.classList.add('burn');
    el.priceLabel.textContent = '你没去的这段时间,单价一直卡在';
    el.delta.className = 'stamp stamp-burn delta';
    // 年卡按 365 天摊,断 N 天 = 白付了多少天的钱
    const perDay = Math.round(CARD.total / 365);
    el.deltaText.textContent = `断卡 ${breakDays} 天 · 白扔 ¥${perDay * breakDays}`;
    el.hint.textContent = `不去,这 ¥${price}/次 就一直降不下来`;
    el.checkin.disabled = false;
    return price;
  }

  // 正常态
  el.price.classList.remove('burn');
  el.priceLabel.textContent = '你每去一次,这一次实际花了';

  // delta:这一次比上一次便宜了多少
  const diff = prevPrice - price;
  if (opts.justCheckedIn && diff > 0) {
    el.delta.className = 'stamp stamp-save delta';
    el.deltaText.textContent = `这次比上次便宜 ¥${diff}`;
  } else if (count === CARD.start && !opts.justCheckedIn) {
    el.delta.className = 'stamp stamp-alert delta';
    el.deltaText.textContent = '去一次试试,看单价怎么掉';
  }

  // hint:跟心理价比,贵还是省
  if (goodDeal) {
    el.hint.textContent = `已低于你心里价 ¥${CARD.worth}/次 · 去越多越省`;
  } else {
    el.hint.textContent = `比你心里价 ¥${CARD.worth}/次 还贵 ¥${price - CARD.worth} · 不限次,继续去会更便宜`;
  }

  el.checkin.disabled = false;
  return price;
}

// ---- 里程碑 toast ----
let toastTimer = null;
function showToast(big, small) {
  el.toast.innerHTML = big + (small ? `<small>${small}</small>` : '');
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 1800);
}

// ---- 核心动作:打卡(去一次) ----
function doCheckIn() {
  const wasBroken = breakDays > 0;
  breakDays = 0;

  const before = truePrice(count);
  count += 1;
  const after = truePrice(count);

  rollNumber(before, after);             // 数字往下滚(灵魂)

  el.checkin.classList.remove('bump');
  void el.checkin.offsetWidth;
  el.checkin.classList.add('bump');
  if (navigator.vibrate && !reduceMotion) navigator.vibrate(12);

  // 里程碑:刚跨过"低于心里价"那条线
  const justBecameGoodDeal = before > CARD.worth && after <= CARD.worth;
  if (wasBroken) {
    showToast('欢迎回来 👊', '继续去,把单价打下去');
  } else if (justBecameGoodDeal) {
    showToast('划算了!', `每次 ¥${after},已低于你心里价 ¥${CARD.worth}`);
  } else if (after < before && (before - after) >= 60) {
    showToast(`↓ ¥${before - after}`, '这一次,单价掉了一大截');
  }

  prevPrice = before;
  render({ justCheckedIn: true });
}

// ---- 撤销 ----
function undo() {
  if (count <= 0) return;
  breakDays = 0;
  const before = truePrice(count);
  count -= 1;
  const after = truePrice(count);
  rollNumber(before, after);
  prevPrice = after;
  render();
}

// ---- 事件绑定 ----
el.checkin.addEventListener('click', doCheckIn);
el.undo.addEventListener('click', undo);

// ---- 控制台(原型专用) ----
$('sim-burst').addEventListener('click', () => {
  let i = 0;
  const tick = () => { if (i++ < 5) { doCheckIn(); setTimeout(tick, 420); } };
  tick();
});
$('sim-payback').addEventListener('click', () => {
  breakDays = 0;
  const before = truePrice(count);
  count = GOOD_DEAL_AT;
  rollNumber(before, truePrice(count));
  prevPrice = before;
  render({ justCheckedIn: true });
  showToast('划算了!', `每次 ¥${truePrice(count)},已低于你心里价 ¥${CARD.worth}`);
});
$('sim-break').addEventListener('click', () => {
  breakDays = 16;
  render();
  showToast('⚠️ 断卡 16 天', '单价降不下来,还在白付钱');
});
$('sim-reset').addEventListener('click', () => {
  count = CARD.start; breakDays = 0; prevPrice = truePrice(count);
  el.priceVal.textContent = truePrice(count);
  render();
});

// ---- 初始渲染 ----
el.priceVal.textContent = truePrice(count);
render();

