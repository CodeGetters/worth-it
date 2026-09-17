'use client';

import { useEffect, useState } from 'react';
import { useCards } from '@/lib/store';
import { parseNumber, fmtDate, type Card } from '@/lib/engine';
import { toast } from '@/components/ToastHost';

export default function AddPage() {
  const addCard = useCards((s) => s.addCard);
  const [type, setType] = useState<'unlimited' | 'limited'>('unlimited');
  const [form, setForm] = useState({ name: '', price: '', mental: '', months: '12', total: '', start: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm((f) => ({ ...f, start: fmtDate(Date.now()) }));
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '给卡起个名字吧';
    const p = parseNumber(form.price);
    if (p === null) errs.price = '总价需要填写';
    else if (Number.isNaN(p)) errs.price = '总价要填数字';
    else if (p <= 0) errs.price = '总价不能是 0 或负数';
    else if (p > 100000000) errs.price = '总价超出范围（≤ 1 亿）';
    const m = parseNumber(form.mental);
    if (form.mental.trim() !== '') {
      if (m === null || Number.isNaN(m)) errs.mental = '心里价要填数字';
      else if (m <= 0) errs.mental = '心里价不能是 0 或负数';
    }
    const mo = parseNumber(form.months);
    if (mo === null || Number.isNaN(mo)) errs.months = '有效期需要填写';
    else if (mo < 1 || mo > 60) errs.months = '有效期请填 1 – 60 个月';
    if (type === 'limited') {
      const t = parseNumber(form.total);
      if (t === null || Number.isNaN(t)) errs.total = '有限次课包需要填总次数';
      else if (t < 1 || t > 9999) errs.total = '总次数请填 1 – 9999';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast('先修正标红的输入项'); return; }
    const card: Card = {
      id: 'c' + Date.now(),
      name: form.name.trim(),
      type,
      price: parseNumber(form.price) as number,
      mental: parseNumber(form.mental) ?? 30,
      start: form.start || fmtDate(Date.now()),
      months: parseNumber(form.months) as number,
      total: type === 'limited' ? (parseNumber(form.total) as number) : null,
      checkins: [],
      created: Date.now(),
    };
    addCard(card);
    toast(`「${card.name}」已开卡，去打第一张卡`);
    location.assign('/soul');
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const err = (k: string, label: string) => errors[k] ? (
    <div className="err" role="alert"><svg className="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3.5 2.5 20h19L12 3.5z" /><path d="M12 10v4.5" /></svg>{errors[k]}</div>
  ) : null;

  return (
    <section className="page-in" aria-label="添加卡">
      <span className="kicker">NEW CARD</span>
      <h1 className="page-title">添加我的卡</h1>
      <p className="page-sub">像填一张待开的小票，尽量少填。默认值能填的都填好了。</p>
      <div className="layout mt24">
        <form className="form-card" onSubmit={submit} noValidate>
          <div className="fgroup"><span className="fg-title">这是什么卡</span></div>
          <div className="frow frow-2">
            <div className={'field' + (errors.name ? ' invalid' : '')}>
              <label htmlFor="f-cname">卡名 <em>必填</em></label>
              <input className={'input' + (errors.name ? ' is-error' : '')} id="f-cname" maxLength={20}
                placeholder="例如：健身年卡" value={form.name} onChange={set('name')} />
              {err('name', '卡名')}
            </div>
            <div className="field">
              <label htmlFor="f-ctype">卡型 <em>必选</em></label>
              <select className="input" id="f-ctype" style={{ paddingRight: 14 }}
                value={type} onChange={(e) => setType(e.target.value as 'unlimited' | 'limited')}>
                <option value="unlimited">不限次（年卡/月卡）</option>
                <option value="limited">有限次（课包）</option>
              </select>
            </div>
          </div>
          <div className="fgroup"><span className="fg-title">花了多少钱</span></div>
          <div className="frow frow-2">
            <div className={'field' + (errors.price ? ' invalid' : '')}>
              <label htmlFor="f-cprice">总价 <em>必填</em></label>
              <div className="control">
                <input className={'input' + (errors.price ? ' is-error' : '')} id="f-cprice" inputMode="decimal"
                  placeholder="例如 3,000" value={form.price} onChange={set('price')} />
                <span className="unit">¥</span>
              </div>
              {err('price', '总价')}
            </div>
            <div className={'field' + (errors.mental ? ' invalid' : '')}>
              <label htmlFor="f-cmental">心里一次值多少 <em>可先不填</em></label>
              <div className="control">
                <input className={'input' + (errors.mental ? ' is-error' : '')} id="f-cmental" inputMode="decimal"
                  placeholder="30" value={form.mental} onChange={set('mental')} />
                <span className="unit">¥/次</span>
              </div>
              <div className="hint">用来画参照线，不是回本终点</div>
              {err('mental', '心里价')}
            </div>
          </div>
          <div className="fgroup"><span className="fg-title">用多久</span></div>
          <div className="frow frow-2">
            <div className="field">
              <label htmlFor="f-cstart">购买日 <em>默认今天</em></label>
              <input className="input" id="f-cstart" type="date" value={form.start} onChange={set('start')} />
            </div>
            <div className={'field' + (errors.months ? ' invalid' : '')}>
              <label htmlFor="f-cmonths">有效期 <em>必填</em></label>
              <div className="control">
                <input className={'input' + (errors.months ? ' is-error' : '')} id="f-cmonths" inputMode="numeric"
                  placeholder="12" value={form.months} onChange={set('months')} />
                <span className="unit">月</span>
              </div>
              <div className="hint">年卡填 12</div>
              {err('months', '有效期')}
            </div>
          </div>
          {type === 'limited' && (
            <div className="frow frow-2">
              <div className={'field' + (errors.total ? ' invalid' : '')}>
                <label htmlFor="f-ctotal">总次数 <em>课包必填</em></label>
                <div className="control">
                  <input className={'input' + (errors.total ? ' is-error' : '')} id="f-ctotal" inputMode="numeric"
                    placeholder="例如 40" value={form.total} onChange={set('total')} />
                  <span className="unit">次</span>
                </div>
                {err('total', '总次数')}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button type="submit" className="btn btn-primary">开卡 →</button>
            <a className="btn btn-ghost" href="/soul">先回打卡</a>
          </div>
        </form>
        <aside className="side">
          <div className="panel-line">
            <h3>怎么玩</h3>
            <p className="hint" style={{ fontSize: 13, lineHeight: 1.8 }}>
              开卡后你会得到一张灵魂屏：每次去用完点一下打卡，单价就会往下掉一格。<br /><br />
              断了不去？单价卡住，底部会开始「催你」。<br /><br />
              打卡可以补记过去的日子（限购买日到今天），一天可以去多次。
            </p>
          </div>
          <div className="panel-line">
            <h3>先试试这张</h3>
            <p className="hint" style={{ fontSize: 13, lineHeight: 1.8 }}>
              首次进入已放一张可直接玩的「健身年卡」示例卡——先去打卡页点一下，尝尝单价往下掉的甜头，再回来添加自己的卡。
            </p>
            <a className="btn btn-ghost btn-sm" href="/soul" style={{ marginTop: 12 }}>去打卡</a>
          </div>
        </aside>
      </div>
    </section>
  );
}
