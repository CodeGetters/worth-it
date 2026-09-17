'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useCards, useTheme } from '@/lib/store';
import { calcCard, fmtMoney, fmtMoney2, fmtDate, depthOf } from '@/lib/engine';

const DIVE = { btn: '今天去了，下潜', undo: '撤销上次打卡', foot: '水面 = 刚办卡 · 心里价在深处等你', eqPrefix: '当前水深', depthLabel: true };
const FORGE = { btn: '打一锤 · 记一次打卡', undo: '撤销上一锤', foot: '发火 = 刚办卡 · 锻满 = 值回票价', eqPrefix: '成色推进', depthLabel: false };

export default function SoulPage() {
  const cards = useCards((s) => s.cards);
  const curCardId = useCards((s) => s.curCardId);
  const setCur = useCards((s) => s.setCur);
  const checkin = useCards((s) => s.checkin);
  const undoCheckin = useCards((s) => s.undoCheckin);
  const addSample = useCards((s) => s.addSample);
  const theme = useTheme((s) => s.theme);

  const card = cards.find((c) => c.id === curCardId) ?? cards[0] ?? null;
  const [hydrated, setHydrated] = useState(false);
  const [lastPrice, setLastPrice] = useState<number | null | undefined>(undefined);
  const [msMsg, setMsMsg] = useState<{ title: string; sub: string } | null>(null);
  const [fxKey, setFxKey] = useState(0);
  const animRef = useRef<number | null>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setHydrated(true), []);

  // 空状态自动放示例卡
  useEffect(() => {
    if (hydrated && cards.length === 0) addSample();
  }, [hydrated, cards.length, addSample]);

  // 主题动词
  const verbs = theme === 'forge' ? FORGE : DIVE;
  const isForge = theme === 'forge';

  // 数字滚动动画
  const rollPrice = useCallback((from: number | null | undefined, to: number | null) => {
    const el = numRef.current;
    if (!el) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (from === null || from === undefined || to === null || from === to) {
      el.textContent = to === null ? '–' : fmtMoney2(to).replace('¥', '');
      return;
    }
    const t0 = performance.now();
    const dur = 620;
    const frame = (t: number) => {
      const k = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtMoney2(from + (to - from) * eased).replace('¥', '');
      if (k < 1) animRef.current = requestAnimationFrame(frame);
    };
    animRef.current = requestAnimationFrame(frame);
  }, []);

  const st = card ? calcCard(card) : null;
  const isMs = !!(st?.price !== null && st?.price !== undefined && card?.mental && st.price <= card.mental);

  useEffect(() => {
    if (!st) return;
    rollPrice(lastPrice, st.price);
    setLastPrice(st.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st?.price, st?.hits]);

  const doCheckin = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!card) return;
    // 涟漪
    const btn = e?.currentTarget;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const rip = document.createElement('span');
      rip.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      rip.style.width = rip.style.height = size + 'px';
      rip.style.left = (e!.clientX - rect.left - size / 2) + 'px';
      rip.style.top = (e!.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 560);
    }
    const before = calcCard(card);
    checkin(card.id);
    setFxKey((k) => k + 1);
    const after = calcCard({ ...card, checkins: [...card.checkins, Date.now()] });
    const afterPrice = after.price;
    if (
      afterPrice !== null && card.mental &&
      before.price !== null && before.price > card.mental && afterPrice <= card.mental
    ) {
      setMsMsg({ title: '里程碑 · 单价已低于心里价', sub: '之后每去一次都是白赚' });
      setTimeout(() => setMsMsg(null), 2800);
    } else if (card.type === 'limited' && card.total && after.hits === card.total) {
      setMsMsg({ title: `打满了 · ${card.total} 次全部用完`, sub: `单价定格 ${fmtMoney2(afterPrice ?? 0)}` });
      setTimeout(() => setMsMsg(null), 2800);
    }
    // bump 动画
    const bn = numRef.current;
    if (bn) { bn.classList.remove('bump'); void bn.offsetWidth; bn.classList.add('bump'); }
  };

  const doUndo = () => {
    if (!card || card.checkins.length === 0) return;
    undoCheckin(card.id);
  };

  const openCal = () => {
    if (!card) return;
    const startTs = new Date(card.start + 'T00:00:00').getTime();
    const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00').getTime();
    const days: number[] = [];
    for (let d = 13; d >= 0; d--) {
      const ts = todayStart - d * 86400000;
      if (ts >= startTs) days.push(ts);
    }
    const html = `<div class="cal-grid">` + days.map((ts) => {
      const hit = card.checkins.some((c) => fmtDate(c) === fmtDate(ts));
      const dt = new Date(ts);
      return `<button class="cal-day${hit ? ' hit' : ''}" data-ts="${ts}" ${hit ? 'disabled' : ''}>${dt.getMonth() + 1}/${dt.getDate()}</button>`;
    }).join('') + '</div>';
    window.dispatchEvent(new CustomEvent('worthit:calendar', { detail: { cardId: card.id, html } }));
  };

  // 卡切换时重置动画基线
  useEffect(() => { setLastPrice(undefined); }, [curCardId]);

  const noCard = hydrated && !card;

  return (
    <section className="soul page-in" aria-label="打卡">
      {card && (
        <>
          <div className="soul-chip" role="button" tabIndex={0}
            onClick={() => location.assign('/overview')}
            onKeyDown={(e) => { if (e.key === 'Enter') location.assign('/overview'); }}>
            <span>{card.name}</span>
            <small>{card.type === 'limited' ? `有限次 ${card.total} 次` : '不限次'}</small>
          </div>
          {cards.length > 1 && (
            <div className="card-switcher on">
              {cards.map((c) => (
                <button key={c.id} className={'cs-dot' + (c.id === card.id ? ' on' : '')}
                  onClick={() => setCur(c.id)}>{c.name}</button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="hero-price">
        <div className="lbl">CURRENT TRUE COST</div>
        <div className={'big-price' + (isMs ? ' ms' : !st || st.price === null ? ' dash' : '')}>
          <span ref={numRef}>–</span>
          <small> /次</small>
        </div>
        <div className="soul-eq" id="soul-eq">
          {!card && '还没有卡，放一张示例卡先玩起来'}
          {card && st && st.price === null && '打第一次卡后开始计算'}
          {card && st && st.price !== null && (
            isMs ? (
              <>
                {isForge ? '成色达标' : <>当前水深 <b>{depthOf(st.price)}m</b></>} · 已达心里价 · 每去一次白赚 <b>{fmtMoney2(card.mental - st.price)}</b>，累计 <b>{fmtMoney(Math.round((card.mental - st.price) * st.hits))}</b>
              </>
            ) : (
              <>
                {isForge ? '成色推进' : <>当前水深 <b>{depthOf(st.price)}m</b>，潜得越深花得越少</>} · 离心里价 <b>{fmtMoney2(card.mental)}</b> 还差 {st.hitsToGo} 次
              </>
            )
          )}
        </div>
      </div>

      {card && st && st.price !== null && card.mental > 0 && (
        <div className="gauge-wrap">
          <div className="gauge-row">
            <span id="gauge-lbl">{isMs ? '已锁定的白赚空间' : isForge ? '心里价达成' : '下潜进度 · 心里价'}</span>
            <span className="big">{Math.round(st.mentalPct * 100)}%</span>
          </div>
          <div className="gauge">
            <span className="fill" key={st.hits} style={{ width: Math.min(Math.round(st.mentalPct * 100), 100) + '%' }} />
            {!isMs && <span className="mark" />}
          </div>
        </div>
      )}

      {card && st != null && (() => {
        const s2 = st;
        return (
        <div className="telemetry">
          <span className="t"><b>{s2.hits}</b><small>{isForge ? '已锻锤数' : '已打卡'}</small></span>
          <span className="t">
            <b>{isMs ? fmtMoney2(card.mental - (s2.price ?? 0)) : s2.price === null ? '–' : (isFinite(s2.hitsToGo) ? s2.hitsToGo : '∞')}</b>
            <small>{isMs ? '每次白赚' : '距心里价'}</small>
          </span>
          <span className="t">
            <b>{isMs ? fmtMoney(Math.round((card.mental - (s2.price ?? 0)) * s2.hits)) : fmtMoney(s2.dailyBurn)}</b>
            <small>{isMs ? '累计白赚' : isForge ? '日均炉温' : '日均成本'}</small>
          </span>
        </div>
        );
      })()}

      {card && st != null && st.hits > 0 && (
        <div className="record-strip">
          {card.checkins.slice(-28).map((ts, i, arr) => <i key={ts} className={'hit' + (i === arr.length - 1 && fxKey > 0 ? ' pop' : '')} />)}
          {st.hits > 28 && <span className="more">+{st.hits - 28}</span>}
        </div>
      )}

      <button className="checkin-btn" id="btn-checkin" onClick={doCheckin} style={{ position: 'relative', overflow: 'hidden' }}
        disabled={noCard ? false : !!card && !!st && (st.expired || (card.type === 'limited' && !!card.total && st.hits >= card.total))}>
        {!hydrated ? '…' : noCard ? '放一张示例卡' :
          st?.expired ? '已到期 · 去总览看复盘' :
          card?.type === 'limited' && card.total && st && st.hits >= card.total ? `已打满 ${card.total} 次 · 单价定格` :
          verbs.btn}
      </button>
      <button className="undo-btn" id="btn-undo" onClick={doUndo}
        disabled={!card || (st?.hits ?? 0) === 0}>{verbs.undo}</button>
      <button className="undo-btn" style={{ opacity: 0.45 }} onClick={openCal}
        disabled={!card || st?.expired}>补记过去的日子</button>

      {card && st?.nag && !st.expired && (
        <div className={'state-bar show ' + (st.nag.level === 'soft' ? '' : st.nag.level)}>{st.nag.msg}</div>
      )}
      {card && st?.expired && (
        <div className="state-bar show">
          已到期{st.wasted > 0 ? ` · 未用完的部分约 ${fmtMoney(st.wasted)}` : ''} · 最终单价 {st.price !== null ? fmtMoney2(st.price) : '–'}
        </div>
      )}

      <div className="soul-foot">{verbs.foot}</div>

      {msMsg && (
        <div className="ms-toast show">
          {msMsg.title}
          <small>{msMsg.sub}</small>
        </div>
      )}
      <FxLayer fxKey={fxKey} theme={theme} />
    </section>
  );
}

/** 打卡特效：深潜气泡上浮 / 冶炼火星飞溅 */
function FxLayer({ fxKey, theme }: { fxKey: number; theme: string }) {
  const [bursts, setBursts] = useState<number[]>([]);
  useEffect(() => {
    if (fxKey === 0) return;
    setBursts((b) => [...b, fxKey]);
    const t = setTimeout(() => setBursts((b) => b.filter((x) => x !== fxKey)), 1300);
    return () => clearTimeout(t);
  }, [fxKey]);
  return (
    <div id="fx-layer" aria-hidden key={undefined}>
      {bursts.map((b) => (
        <Burst key={b} theme={theme} />
      ))}
    </div>
  );
}

function Burst({ theme }: { theme: string }) {
  const nodes = [];
  const n = theme === 'forge' ? 14 : 10;
  for (let i = 0; i < n; i++) {
    const left = 20 + Math.random() * 60;
    const top = 55 + Math.random() * 25;
    if (theme === 'forge') {
      nodes.push(<i key={i} className="fx-spark" style={{ left: left + '%', top: top + '%', ['--dx' as string]: (Math.random() * 120 - 60) + 'px' }} />);
    } else {
      const size = 4 + Math.random() * 10;
      nodes.push(<i key={i} className="fx-bub" style={{ left: left + '%', top: top + '%', width: size + 'px', height: size + 'px' }} />);
    }
  }
  return <>{nodes}</>;
}
