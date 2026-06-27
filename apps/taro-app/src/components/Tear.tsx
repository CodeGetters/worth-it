import { View } from '@tarojs/components'
import './Tear.scss'

interface TearProps {
  /** 撕齿位置：上沿或下沿 */
  position: 'top' | 'bottom'
  /**
   * 齿的颜色 = 卡片背景色（咬出纸的形状）。默认取票面白 var(--c-card)。
   * 卡片若用别的底色（如断卡红、选中黄），传对应色保持咬口一致。
   */
  color?: string
}

/**
 * 小票撕齿边：卡片上下沿的半圆咬口，「票感」核心视觉。
 * 纯 CSS radial-gradient，无图片，四端通用。齿色靠 currentColor 注入，
 * 故 color 必须传到位（设计稿用内联 color:var(--c-card)）。
 */
export function Tear({ position, color = 'var(--c-card)' }: TearProps) {
  return <View className={`tear tear-${position}`} style={{ color }} />
}
