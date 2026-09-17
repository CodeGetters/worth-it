import type { Metadata, Viewport } from 'next';
import './globals.css';
import './themes.css';
import NavBar from '@/components/NavBar';
import Foot from '@/components/Foot';
import DialogHost from '@/components/DialogHost';
import ToastHost from '@/components/ToastHost';

export const metadata: Metadata = {
  title: '值啦 · 值WORTHIT — 卡都办了，就别让它躺死',
  description: '买了卡之后，每次去用就来打卡。看着真实单次成本一次次往下掉——去得越多越值。',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dive">
      <body>
        <ThemeInit />
        <div className="bg-layer" aria-hidden />
        <div className="bg-veil" aria-hidden />
        <div className="grain" aria-hidden />
        <div id="fx-layer" aria-hidden />
        <div className="app">
          <NavBar />
          {children}
        </div>
        <Foot />
        <DialogHost />
        <ToastHost />
      </body>
    </html>
  );
}

/** 客户端主题水合（避免闪烁） */
function ThemeInit() {
  const script = `
(function(){
  try {
    var t = localStorage.getItem('worthit.theme.v2');
    if (t) {
      var parsed = JSON.parse(t);
      var v = parsed && parsed.state && parsed.state.theme;
      if (v === 'forge' || v === 'dive') document.documentElement.setAttribute('data-theme', v);
    }
  } catch(e){}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
