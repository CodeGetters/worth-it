import { View } from '@tarojs/components'
import './Icon.scss'

/**
 * 图标 glyph 名 → 24×24 viewBox 下的 SVG path d。
 * 全部描边风格（stroke），与设计稿 .svg-i 一致；着色靠 currentColor，故用 mask 实现。
 */
const PATHS: Record<string, string> = {
  // 品牌 logo / 打卡：折线图上扬 + 箭头
  logo: '<path d="M3 17l5-5 4 3 6-7"/><path d="M14 8h4v4"/>',
  // 加号：添加
  plus: '<path d="M12 5v14M5 12h14"/>',
  // 对勾：打卡按钮
  check: '<path d="M20 6L9 17l-5-5"/>',
  // 小对勾：印章内
  checkSmall: '<path d="M7 13l5 5 5-12"/>',
  // 下箭头：单价下降
  arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  // 右箭头：链接 chevron
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  // 返回
  chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
  // 帮助
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>',
  // 灯泡：建议 / 下次怎么选（移植自原型屏6）
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0012 2z"/>',
  // tab：打卡（同 logo）
  tabCheckin: '<path d="M3 17l5-5 4 3 6-7"/><path d="M14 8h4v4"/>',
  // tab：总览
  tabOverview: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
  // tab：我的
  tabMe: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
}

interface IconProps {
  /** glyph 名，见 PATHS */
  name: keyof typeof PATHS
  /** 尺寸 px（自动转 rpx），默认 18 对齐设计稿 .svg-i */
  size?: number
  /** 描边粗细，默认 2 */
  strokeWidth?: number
  /** 颜色，默认 currentColor 跟随父级文字色 */
  color?: string
  className?: string
}

/**
 * 图标（移植自设计稿内联 SVG .svg-i）。
 *
 * 用 CSS mask-image + SVG data URI + background:currentColor 实现：纯 CSS、零资源文件、
 * 随 var(--c-*) 着色，契合「清醒小票」零图片哲学。H5 完美支持 mask；
 * 描边图标用 stroke 版 SVG，故 data URI 里写死 stroke 属性，颜色由外层 background 决定。
 */
export function Icon({ name, size = 18, strokeWidth = 2, color = 'currentColor', className = '' }: IconProps) {
  const inner = PATHS[name] ?? ''
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' ` +
    `stroke='black' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-linejoin='round'>${inner}</svg>`
  // encodeURIComponent 处理 # 等特殊字符，保证 data URI 在各端可解析
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  return (
    <View
      className={`icon ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        WebkitMaskImage: url,
        maskImage: url,
      }}
    />
  )
}
