'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCards } from '@/lib/store';
import { fmtDate } from '@/lib/engine';

/** 全局确认对话框（含补卡日历模式） */
export default function DialogHost() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [okText, setOkText] = useState('确认');
  const [calMode, setCalMode] = useState<{ cardId: string } | null>(null);
  const cbRef = useRef<(() => void) | null>(null);
  const checkin = useCards((s) => s.checkin);
  const [toastMsg, setToastMsg] = useState('');

  const close = useCallback(() => {
    setOpen(false);
    setCalMode(null);
    cbRef.current = null;
    setOkText('确认');
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setTitle(d.title ?? '');
      setBody(d.body ?? '');
      setOkText(d.okText ?? '确认');
      cbRef.current = d.onOk ?? null;
      setCalMode(d.calendar ? { cardId: d.calendar.cardId } : null);
      if (d.calendar) setBody(d.calendar.html);
      setOpen(true);
    };
    window.addEventListener('worthit:dialog', handler);
    return () => window.removeEventListener('worthit:dialog', handler);
  }, []);

  useEffect(() => {
    const calHandler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setTitle('补记哪一天？');
      setBody(d.html);
      setOkText('');
      setCalMode({ cardId: d.cardId });
      setOpen(true);
    };
    window.addEventListener('worthit:calendar', calHandler);
    return () => window.removeEventListener('worthit:calendar', calHandler);
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [close]);

  const pickDay = (ts: number) => {
    if (!calMode) return;
    checkin(calMode.cardId, ts + 12 * 3600000);
    close();
    setToastMsg('已补记 ' + fmtDate(ts));
    setTimeout(() => setToastMsg(''), 2200);
  };

  const showToast = toastMsg !== '';

  return (
    <>
      <div className={'dialog-mask' + (open ? ' on' : '')}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
        <div className="dialog">
          <h4 id="dlg-title">{title}</h4>
          {calMode ? (
            <div dangerouslySetInnerHTML={{ __html: body }}
              onClick={(e) => {
                const t = (e.target as HTMLElement).closest('[data-ts]') as HTMLElement | null;
                if (t && !t.classList.contains('hit')) pickDay(Number(t.getAttribute('data-ts')));
              }} />
          ) : (
            <p id="dlg-body">{body}</p>
          )}
          <div className="d-ops">
            <button className="btn btn-ghost btn-sm" onClick={close}>{calMode ? '关闭' : '取消'}</button>
            {!calMode && okText && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--skip)', borderColor: 'rgba(240,123,98,.4)' }}
                onClick={() => { const cb = cbRef.current; close(); if (cb) cb(); }}>{okText}</button>
            )}
          </div>
        </div>
      </div>
      <div className="toast-zone" aria-live="polite">
        {showToast && <div className="toast">{toastMsg}</div>}
      </div>
    </>
  );
}

import { useRef } from 'react';
