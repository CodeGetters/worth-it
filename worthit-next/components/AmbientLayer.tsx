'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/store';

interface Node {
  id: number;
  kind: 'ray' | 'mote' | 'bub';
  style: React.CSSProperties;
}

/** 环境常驻动效：光柱 / 悬浮尘埃与余烬 / 上升气泡（客户端渲染避免水合差异） */
export default function AmbientLayer() {
  const theme = useTheme((s) => s.theme);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const list: Node[] = [];
    let id = 0;
    // 光柱 ×3（深潜可见，冶炼隐藏 by CSS）
    for (let i = 0; i < 3; i++) {
      list.push({
        id: id++,
        kind: 'ray',
        style: { left: `${8 + i * 26 + Math.random() * 8}%`, animationDelay: `${i * 2.4}s` },
      });
    }
    // 尘埃/余烬 ×22
    for (let i = 0; i < 22; i++) {
      list.push({
        id: id++,
        kind: 'mote',
        style: {
          left: `${Math.random() * 100}%`,
          top: `${30 + Math.random() * 70}%`,
          animationDelay: `${Math.random() * 12}s`,
          animationDuration: `${8 + Math.random() * 8}s`,
        },
      });
    }
    // 气泡 ×10
    for (let i = 0; i < 10; i++) {
      const size = 4 + Math.random() * 12;
      list.push({
        id: id++,
        kind: 'bub',
        style: {
          left: `${Math.random() * 100}%`,
          bottom: `-4vh`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${Math.random() * 11}s`,
          animationDuration: `${8 + Math.random() * 7}s`,
        },
      });
    }
    setNodes(list);
  }, []);

  if (!ready) return null;
  return (
    <div className="ambient" aria-hidden>
      {nodes.map((n) => (
        <span
          key={n.id}
          className={n.kind === 'ray' ? `ray r${(n.id % 3) + 1}` : n.kind === 'mote' ? 'mote' : 'amb-bub'}
          style={n.style}
        />
      ))}
    </div>
  );
}
