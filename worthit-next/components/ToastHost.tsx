'use client';

import { useEffect, useState } from 'react';

interface ToastItem { id: number; msg: string }

let pushToast: ((msg: string) => void) | null = null;
export function toast(msg: string) {
  if (pushToast) pushToast(msg);
}

/** 顶部单实例 Toast（新消息替换旧消息） */
export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [out, setOut] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let curId = 0;
    pushToast = (msg: string) => {
      curId += 1;
      setOut(false);
      setItems([{ id: curId, msg }]);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setOut(true);
        setTimeout(() => setItems([]), 260);
      }, 2400);
    };
    return () => { if (timer) clearTimeout(timer); pushToast = null; };
  }, []);

  return (
    <div className="toast-zone" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={'toast' + (out ? ' out' : '')}>{t.msg}</div>
      ))}
    </div>
  );
}
