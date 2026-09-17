'use client';

import { useCards, useTheme, type Theme } from '@/lib/store';

export default function Foot() {
  const cards = useCards((s) => s.cards);
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify({ app: 'worthit', version: 2, exportedAt: new Date().toISOString(), cards }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'worthit-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 800);
    } catch { /* 忽略 */ }
  };
  return (
    <footer className="app-foot">
      <span className="af-brand"><span className="brand-mark" aria-hidden />值啦 WORTHIT</span>
      <span className="af-sep" />
      <span>数据只存在本机浏览器 · 不构成消费建议</span>
      <span className="af-sep" />
      <button className="af-link" onClick={exportData}>导出数据</button>
      <span>{cards.length > 0 ? `· ${cards.length} 张卡` : ''}</span>
      <span className="seg-fallback" aria-label="主题切换（移动端）">
        {(['dive', 'forge'] as Theme[]).map((t) => (
          <button key={t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>
            {t === 'dive' ? '深潜' : '冶炼'}
          </button>
        ))}
      </span>
    </footer>
  );
}
