'use client';

import { useEffect, useState } from 'react';
import { useCards } from '@/lib/store';
import { calcCard, fmtMoney, fmtMoney2 } from '@/lib/engine';
import { toast } from '@/components/ToastHost';
import Dialog from '@/components/Dialog';

export default function OverviewPage() {
  const cards = useCards((s) => s.cards);
  const setCur = useCards((s) => s.setCur);
  const removeCard = useCards((s) => s.removeCard);
  const addSample = useCards((s) => s.addSample);
  const [hydrated, setHydrated] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;

  const sorted = cards
    .map((c) => ({ c, st: calcCard(c) }))
    .sort((a, b) => {
      const w: Record<string, number> = { on: 0, lurk: 1, done: 2 };
      return w[a.st.status] - w[b.st.status];
    });

  const sumWaste = sorted.reduce((acc, x) => acc + x.st.wasted, 0);

  const openDel = (id: string) => { setDelId(id); setDialogOpen(true); };
  const doDel = () => {
    if (delId) {
      removeCard(delId);
      toast('已删除');
    }
    setDialogOpen(false);
    setDelId(null);
  };

  return (
    <section className="page-in" aria-label="总览">
      <span className="kicker">OVERVIEW · 哪张值哪张亏</span>
      <h1 className="page-title">我的卡</h1>
      <p className="page-sub">在用的盯紧点，躺着的赶紧去，白办的下次别续。</p>

      {cards.length === 0 ? (
        <div className="empty mt24">
          <h3>一张卡都还没有</h3>
          <p>先放一张示例卡玩玩，或添加你自己的卡。</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => { addSample(); toast('示例卡已就位'); }}>放示例卡</button>
            <a className="btn btn-ghost btn-sm" href="/add">添加我的卡</a>
          </div>
        </div>
      ) : (
        <>
          {sumWaste > 0 && (
            <div className="state-bar show warn" style={{ maxWidth: 'none', marginTop: 20 }}>
              已过期的卡里，还有 <b>{fmtMoney(sumWaste)}</b> 次数被浪费了——下次开卡前先看看这份账。
            </div>
          )}
          <div className="ov-grid">
            {sorted.map(({ c, st }) => {
              const sm = st.status === 'on' ? ['ov-on', '在用'] : st.status === 'lurk' ? ['ov-lurk', '在亏'] : ['ov-done', '已结束'];
              return (
                <div key={c.id} className="ov-card" role="button" tabIndex={0}
                  onClick={() => { setCur(c.id); location.assign('/soul'); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setCur(c.id); location.assign('/soul'); } }}>
                  <div className="ov-name">{c.name}</div>
                  <div className="ov-meta">¥{c.price.toLocaleString('zh-CN')} · {c.type === 'limited' ? `有限次 ${c.total} 次` : '不限次'} · {c.months} 个月</div>
                  <div className="ov-price">{st.price !== null ? fmtMoney2(st.price) : '–'}<small> /次</small></div>
                  <span className={'ov-status ' + sm[0]}><i />{sm[1]} · 已打 {st.hits} 次</span>
                  <button className="ov-del" onClick={(e) => { e.stopPropagation(); openDel(c.id); }}>删除这张卡</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog
        open={dialogOpen}
        title="删除这张卡？"
        body={`「${cards.find((c) => c.id === delId)?.name ?? ''}」及其全部打卡记录将被移除，不可恢复。可先在页脚导出数据留底。`}
        okText="确认删除"
        onOk={doDel}
        onCancel={() => setDialogOpen(false)}
      />
    </section>
  );
}
