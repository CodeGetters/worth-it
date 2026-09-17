'use client';

import { useEffect } from 'react';

interface Props {
  open: boolean;
  title: string;
  body: string;
  okText?: string;
  onOk?: () => void;
  onCancel: () => void;
}

/** 通用确认对话框 */
export default function Dialog({ open, title, body, okText = '确认', onOk, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="dialog-mask on" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
      <div className="dialog">
        <h4 id="dlg-title">{title}</h4>
        <p>{body}</p>
        <div className="d-ops">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>取消</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--skip)', borderColor: 'rgba(240,123,98,.4)' }} onClick={onOk}>{okText}</button>
        </div>
      </div>
    </div>
  );
}
