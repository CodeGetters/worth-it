'use client';

import { useState } from 'react';
import { calcWorth, fmtMoney2, type WorthResult } from '@/lib/engine';

const VERDICT_META: Record<string, { badge: string; label: string; line: string }> = {
  worth: { badge: 'badge-worth', label: '值得买', line: '这钱花得踏实。' },
  marginal: { badge: 'badge-marginal', label: '边际情况', line: '贴着心理价，成败看坚持度。' },
  skip: { badge: 'badge-skip', label: '不建议', line: '按这个用法，先别买。' },
};

export default function CalcPage() {
  const [form, setForm] = useState({ price: '', freq: '', years: '', mental: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<WorthResult | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = calcWorth(form);
    setErrors(r.ok ? {} : r.errs);
    setResult(r.ok ? r : null);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const errField = (k: 'price' | 'freq' | 'years' | 'mental') =>
    errors[k] ? <div className="err" role="alert">{errors[k]}</div> : null;

  return (
    <section className="page-in" aria-label="买前计算器">
      <span className="kicker">BEFORE BUYING · 还没买</span>
      <h1 className="page-title">买前算一笔</h1>
      <p className="page-sub">还没买，先算算按你的预期值不值。买完之后，去「打卡」页跟踪真实单价。</p>
      <div className="layout mt24">
        <form className="form-card" onSubmit={submit} noValidate>
          <div className="fgroup"><span className="fg-title">按你的预期算</span></div>
          <div className="frow frow-2">
            <div className={'field' + (errors.price ? ' invalid' : '')}>
              <label htmlFor="f-p2">价格 <em>必填</em></label>
              <div className="control">
                <input className={'input' + (errors.price ? ' is-error' : '')} id="f-p2" inputMode="decimal"
                  placeholder="例如 1,200" value={form.price} onChange={set('price')} />
                <span className="unit">¥</span>
              </div>
              {errField('price')}
            </div>
            <div className={'field' + (errors.freq ? ' invalid' : '')}>
              <label htmlFor="f-f2">使用频率 <em>必填</em></label>
              <div className="control">
                <input className={'input' + (errors.freq ? ' is-error' : '')} id="f-f2" inputMode="decimal"
                  placeholder="例如 5" value={form.freq} onChange={set('freq')} />
                <span className="unit">次/周</span>
              </div>
              {errField('freq')}
            </div>
          </div>
          <div className="frow frow-2">
            <div className={'field' + (errors.years ? ' invalid' : '')}>
              <label htmlFor="f-y2">预计使用年限 <em>必填</em></label>
              <div className="control">
                <input className={'input' + (errors.years ? ' is-error' : '')} id="f-y2" inputMode="decimal"
                  placeholder="例如 3" value={form.years} onChange={set('years')} />
                <span className="unit">年</span>
              </div>
              {errField('years')}
            </div>
            <div className={'field' + (errors.mental ? ' invalid' : '')}>
              <label htmlFor="f-t2">单次心理价位 <em>默认 ¥30</em></label>
              <div className="control">
                <input className={'input' + (errors.mental ? ' is-error' : '')} id="f-t2" inputMode="decimal"
                  placeholder="30" value={form.mental} onChange={set('mental')} />
                <span className="unit">¥/次</span>
              </div>
              {errField('mental')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button type="submit" className="btn btn-primary">帮我算算值不值 →</button>
          </div>

          {result?.ok && (
            <div className="panel-line mt24" style={{ textAlign: 'center', padding: '34px 24px' }}>
              <span className={'badge ' + VERDICT_META[result.verdict as string].badge}>
                <i />{VERDICT_META[result.verdict as string].label}
              </span>
              <div style={{ fontFamily: 'var(--qt-mono)', fontSize: 52, fontWeight: 'var(--price-weight)', letterSpacing: 'var(--price-tracking)', margin: '14px 0 4px' }}>
                {fmtMoney2(result.C as number)}<span style={{ fontSize: 16, opacity: 0.55 }}> /次</span>
              </div>
              <p className="hint">{VERDICT_META[result.verdict as string].line}</p>
              <p className="hint" style={{ marginTop: 10 }}>
                预计总使用 {Math.round(result.N as number).toLocaleString('zh-CN')} 次 · 回本需 {Math.round(result.K as number)} 次 · 评分 {result.score}/100
              </p>
              <a className="btn btn-primary btn-sm" href="/add" style={{ marginTop: 16 }}>买好了？去开卡打卡 →</a>
            </div>
          )}
        </form>
        <aside className="side">
          <div className="panel-line">
            <h3>买完之后呢</h3>
            <p className="hint" style={{ fontSize: 13, lineHeight: 1.8 }}>
              真实的使用不会完全按预期来。买完之后去「打卡」页记每一次真实使用，看单价怎么随实际行为变化——那才是真正的账。
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
