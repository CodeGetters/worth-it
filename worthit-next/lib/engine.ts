/* ============================================================
 * 值啦 WORTHIT · 打卡引擎（纯函数，零依赖，可独立单测）
 *
 * 口径（与产品文档一致）：
 * - 真实单价 = 卡总价 ÷ 已打卡次数（活数字，打一次掉一截）
 * - 不限次卡：无终点；心里价只是参照线（0–100% 仪表）
 * - 有限次课包：打满冻结；到期未用次数按比例折算浪费金额
 * - 断卡负反馈四级：soft(3–6天) → warn(7–14天) → stop(15–20天)
 *   → giveup(21天+，止损劝退)
 * - 边界：0 打卡 → price=null；过期冻结打卡与预测
 * ============================================================ */

export type CardType = 'unlimited' | 'limited';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  /** 卡总价（元） */
  price: number;
  /** 心里一次值多少钱（参照线，默认 30） */
  mental: number;
  /** 购买日 YYYY-MM-DD */
  start: string;
  /** 有效期（月） */
  months: number;
  /** 有限次卡的总次数；不限次为 null */
  total: number | null;
  /** 打卡时间戳列表（ms） */
  checkins: number[];
  created: number;
}

export type CardStatus = 'on' | 'lurk' | 'done';
export type NagLevel = 'soft' | 'warn' | 'stop' | 'giveup';

export interface Nag {
  level: NagLevel;
  msg: string;
}

export interface CardState {
  /** 打卡次数 */
  hits: number;
  /** 真实单价；0 次打卡为 null（不显示天价） */
  price: number | null;
  /** 是否已过期 */
  expired: boolean;
  /** 距上次打卡（或购买）天数 */
  daysSinceLast: number;
  /** 心里价达成比例 0–1 */
  mentalPct: number;
  /** 有限次卡过期未用部分的浪费金额 */
  wasted: number;
  status: CardStatus;
  nag: Nag | null;
  /** 有效期结束时间戳 */
  endTs: number;
  /** 距过期天数（负数=已过期） */
  daysToExpire: number;
  /** 有限次卡剩余次数 */
  remaining: number | null;
  /** 距心里价还差几次 */
  hitsToGo: number;
  /** 里程碑：单价已达心里价 */
  milestone: boolean;
  /** 持有天数 */
  heldDays: number;
  /** 日均成本 */
  dailyBurn: number;
}

export function parseNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().replace(/[,\s￥¥]/g, '');
  if (s === '') return null;
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(s)) return NaN;
  const v = Number(s);
  return isFinite(v) ? v : NaN;
}

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function clamp(x: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, x));
}

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (x: number): string => (x < 10 ? '0' : '') + x;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function dayDiff(ts1: number, ts2: number): number {
  return Math.floor((ts2 - ts1) / 86400000);
}

/** 深潜叙事：单价越低潜得越深（40m 封顶，心里价 30 元 ≈ 信标深度） */
export function depthOf(price: number): number {
  return Math.min(40, Math.round(7200 / Math.max(price, 1)));
}

/** 距心里价还差几次 */
export function hitsToGo(price: number, mental: number, hits: number): number {
  if (!mental) return Infinity;
  return Math.max(0, Math.ceil(price / mental - hits));
}

export function calcCard(card: Card, todayTs: number = Date.now()): CardState {
  const startTs = new Date(card.start + 'T00:00:00').getTime();
  const endTs = startTs + card.months * 30.44 * 86400000;
  const hits = card.checkins.length;
  const expired = todayTs > endTs;
  const heldDays = Math.max(1, dayDiff(startTs, Math.min(todayTs, endTs)) + 1);
  const last = hits > 0 ? Math.max(...card.checkins) : null;
  const daysSinceLast = last !== null ? dayDiff(last, todayTs) : dayDiff(startTs, todayTs);
  const price = hits > 0 ? card.price / hits : null;
  const milestone = price !== null && card.mental > 0 && price <= card.mental;
  const mentalPct = price !== null && card.mental ? clamp(card.mental / price, 0, 1) : 0;

  let wasted = 0;
  if (card.type === 'limited' && expired && card.total) {
    wasted = Math.max(0, card.total - hits) / card.total * card.price;
  }

  let status: CardStatus = 'on';
  if (expired) status = 'done';
  else if (hits === 0 && daysSinceLast >= 3) status = 'lurk';
  else if (daysSinceLast >= 15) status = 'lurk';

  let nag: Nag | null = null;
  if (!expired && daysSinceLast >= 3) {
    const burn = card.price / heldDays;
    if (daysSinceLast <= 6) {
      nag = { level: 'soft', msg: '好几天没见啦，今天动一动？' };
    } else if (daysSinceLast <= 14) {
      nag = { level: 'warn', msg: `停了 ${daysSinceLast} 天，单价卡在 ${price !== null ? round2(price).toFixed(2) : '–'} 降不下来` };
    } else if (daysSinceLast <= 20) {
      nag = { level: 'stop', msg: `断卡 ${daysSinceLast} 天，白付约 ${fmtYuan(Math.round(burn * daysSinceLast))}` };
    } else {
      nag = { level: 'giveup', msg: '也许这卡本就不适合你——接受沉没成本，下次别续更省' };
    }
  }

  return {
    hits,
    price,
    expired,
    daysSinceLast,
    mentalPct,
    wasted,
    status,
    nag,
    endTs,
    daysToExpire: Math.ceil((endTs - todayTs) / 86400000),
    remaining: card.type === 'limited' && card.total ? Math.max(0, card.total - hits) : null,
    hitsToGo: price !== null && card.mental ? hitsToGo(card.price, card.mental, hits) : Infinity,
    milestone: milestone,
    heldDays,
    dailyBurn: card.price / heldDays,
  };
}

function fmtYuan(v: number): string {
  return '¥' + v.toLocaleString('zh-CN');
}

/* ══════════ 买前计算器（买前算一笔子页） ══════════ */

export type Verdict = 'worth' | 'marginal' | 'skip';

export interface WorthResult {
  ok: boolean;
  errs: Record<string, string>;
  N?: number;
  C?: number;
  K?: number;
  score?: number;
  verdict?: Verdict;
  mental?: number;
}

export function calcWorth(input: { price: unknown; freq: unknown; years: unknown; mental: unknown }): WorthResult {
  const p = parseNumber(input.price);
  const f = parseNumber(input.freq);
  const y = parseNumber(input.years);
  let t = parseNumber(input.mental);
  if (t === null) t = 30;
  const errs: Record<string, string> = {};
  if (p === null || Number.isNaN(p) || p <= 0) errs.price = '价格需要大于 0';
  if (f === null || Number.isNaN(f) || f < 0.1 || f > 21) errs.freq = '频率请填 0.1 – 21';
  if (y === null || Number.isNaN(y) || y < 0.25 || y > 10) errs.years = '年限请填 0.25 – 10 年';
  if (Number.isNaN(t) || t <= 0) errs.mental = '心理价要大于 0';
  if (Object.keys(errs).length) return { ok: false, errs };

  const N = (f as number) * 52 * (y as number);
  const C = (p as number) / N;
  const K = (p as number) / (t as number);
  const sCost = clamp((1.5 - C / (t as number)) / 1, 0, 1) * 100;
  const sFreq = clamp(((f as number) - 0.1) / 2.9, 0, 1) * 100;
  const sScale = clamp((N - 10) / 140, 0, 1) * 100;
  const score = Math.round(0.6 * sCost + 0.25 * sFreq + 0.15 * sScale);

  let verdict: Verdict;
  if (K > N) verdict = 'skip';
  else if (score < 40 || C > (t as number) * 1.1) verdict = 'skip';
  else if ((C <= (t as number) * 0.7 && score >= 60) || (score >= 75 && C <= (t as number))) verdict = 'worth';
  else verdict = 'marginal';

  return { ok: true, errs: {}, N, C, K, score, verdict, mental: t };
}

/* ══════════ 工具 ══════════ */

export function fmtMoney(v: number): string {
  if (!isFinite(v)) return '–';
  const abs = Math.abs(v);
  if (abs >= 10000) return '¥' + (v / 10000).toFixed(2) + ' 万';
  if (abs >= 100) return '¥' + Math.round(v).toLocaleString('zh-CN');
  return '¥' + round2(v).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function fmtMoney2(v: number): string {
  return '¥' + (isFinite(v) ? round2(v).toFixed(2) : '–');
}

export function makeSampleCard(now: number = Date.now()): Card {
  const day = 86400000;
  return {
    id: 'c' + now,
    name: '健身年卡',
    type: 'unlimited',
    price: 3000,
    mental: 30,
    start: fmtDate(now - 60 * day),
    months: 12,
    total: null,
    checkins: [55, 48, 40, 33, 26, 19, 12, 5].map((d) => now - d * day),
    created: now,
  };
}
