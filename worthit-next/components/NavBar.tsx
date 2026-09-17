'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme, type Theme } from '@/lib/store';

export default function NavBar() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const [raised, setRaised] = useState(false);
  const [path, setPath] = useState('/soul');

  useEffect(() => {
    setPath(location.pathname);
    const onScroll = () => setRaised(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/soul', label: '打卡' },
    { href: '/overview', label: '总览' },
    { href: '/add', label: '+ 添加' },
    { href: '/calc', label: '买前算一笔' },
  ];

  const toggle = () => setTheme((theme === 'dive' ? 'forge' : 'dive') as Theme);

  return (
    <div className={'nav-shell' + (raised ? ' raised' : '')}>
      <nav className="app-nav" aria-label="主导航">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          值啦<small>WORTHIT</small>
        </div>
        <div className="nav-right">
          <ul className="app-links">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={path === l.href ? 'on' : ''}>{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="theme-seg" role="group" aria-label="主题切换">
            <span className={'seg-thumb' + (theme === 'forge' ? ' right' : '')} aria-hidden />
            <button className="seg-btn" aria-pressed={theme === 'dive'} onClick={() => setTheme('dive')}>深潜</button>
            <button className="seg-btn" aria-pressed={theme === 'forge'} onClick={() => setTheme('forge')}>冶炼</button>
          </div>
        </div>
      </nav>
    </div>
  );
}
