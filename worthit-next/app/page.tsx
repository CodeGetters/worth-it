'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 首页重定向到灵魂屏 */
export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace('/soul'); }, [router]);
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
      正在进入打卡页…
      <noscript><a href="/soul" style={{ color: 'var(--accent)' }}>点此直达</a></noscript>
    </div>
  );
}
