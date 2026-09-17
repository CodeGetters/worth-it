// 引擎单测（用 node 直接跑 TS 编译后逻辑 —— 通过 tsx 加载）
import { calcCard, calcWorth, hitsToGo, depthOf, parseNumber, makeSampleCard, fmtDate, type Card } from '../lib/engine';
const U = 'unlimited' as const;
const L = 'limited' as const;
let pass = 0, fail = 0;
function check(n: string, a: unknown, e: unknown){ const ok = JSON.stringify(a) === JSON.stringify(e); if (ok) pass++; else { fail++; console.log('FAIL', n, 'actual=', JSON.stringify(a), 'expected=', JSON.stringify(e)); } }
function near(n: string, a: number | null, e: number, tol = 0.01){ const ok = a !== null && Math.abs(a - e) <= tol; if (ok) pass++; else { fail++; console.log('FAIL', n, 'actual=', a, 'expected≈', e); } }

const now = Date.now();
const day = 86400000;
function mk(hitsAgoDays: number[]){
  return { id:'c1', name:'健身年卡', type:U, price:3000, mental:30,
    start: fmtDate(now - 60*day), months:12, total:null,
    checkins: hitsAgoDays.map((d: number) => now - d*day), created: now };
}

// C1: 8 次打卡，最近 5 天前
let st = calcCard(mk([5,12,19,26,33,40,48,55]), now);
check('C1.hits', st.hits, 8);
near('C1.price=375', st.price as number, 375);
check('C1.status=on+soft', [st.status, st.nag?.level ?? null], ['on','soft']);
check('C1.notMilestone', st.milestone, false);
check('C1.hitsToGo=23', st.hitsToGo, Math.ceil(3000/30 - 8));

// C2: 断卡 18 天 → stop 级
st = calcCard(mk([18,40,48,55]), now);
near('C2.price=750', st.price as number, 750);
check('C2.nag=stop', st.nag?.level, 'stop');

// C3: 断卡 25 天 → giveup 止损
st = calcCard(mk([25,40,55]), now);
check('C3.nag=giveup', st.nag?.level, 'giveup');
check('C3.文案含沉没成本', st.nag?.msg.includes('沉没成本') ?? false, true);

// C4: 0 打卡
st = calcCard(mk([]), now);
check('C4.price=null', st.price, null);
check('C4.milestone=false', st.milestone, false);

// C5: 有限次课包过期 → 浪费 = (40-1)/40*2000 = 1950
const c5 = { id:'c2', name:'私教课包', type:L, price:2000, mental:80,
  start: fmtDate(now - 400*day), months:12, total:40, checkins:[now - 100*day], created:now };
st = calcCard(c5, now);
check('C5.expired', st.expired, true);
near('C5.wasted=1950', st.wasted as number, 1950);

// C6: 课包打满 remaining=0
const c6 = { id:'c3', name:'体验课', type:L, price:300, mental:100,
  start: fmtDate(now - 10*day), months:1, total:2,
  checkins:[now - 5*day, now - 2*day], created:now };
st = calcCard(c6, now);
check('C6.remaining=0', st.remaining, 0);

// C7: 里程碑（125 次后 24 ≤ 30）
st = calcCard(mk(Array.from({length:125}, (_,i)=>i*1.5)), now);
near('C7.price=24', st.price as number, 24);
check('C7.milestone=true', st.milestone, true);

// W1-W3: 买前计算器三档
let w = calcWorth({ price:'1200', freq:'5', years:'3', mental:'' });
check('W1.verdict=worth', w.verdict, 'worth');
near('W1.C=1.54', w.C as number, 1.54);
w = calcWorth({ price:'3000', freq:'2', years:'1', mental:'' });
check('W2.verdict=marginal', w.verdict, 'marginal');
w = calcWorth({ price:'15000', freq:'0.5', years:'5', mental:'' });
check('W3.verdict=skip(K>N)', w.verdict, 'skip');

// 边界输入
w = calcWorth({ price:'', freq:'5', years:'3', mental:'' });
check('E1.price空', w.ok === false && !!w.errs.price, true);
w = calcWorth({ price:'-5', freq:'5', years:'3', mental:'' });
check('E2.负价格', w.errs.price.includes('大于 0'), true);
w = calcWorth({ price:'abc', freq:'5', years:'3', mental:'' });
check('E3.非数字', w.errs.price.includes('大于 0'), true);

// 工具函数
check('T1.parseNumber 千分位', parseNumber('3,000'), 3000);
check('T2.parseNumber 空', parseNumber(''), null);
check('T3.depthOf 上限', depthOf(10), 40);
check('T4.hitsToGo 91', hitsToGo(3000, 30, 9), 91);
check('T5.示例卡 8 次', makeSampleCard(now).checkins.length, 8);

console.log('====', pass, 'passed /', fail, 'failed ====');
process.exit(fail ? 1 : 0);
