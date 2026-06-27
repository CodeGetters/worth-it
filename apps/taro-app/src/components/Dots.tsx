import { View } from '@tarojs/components'
import './Dots.scss'

interface DotsProps {
  /** 总卡数 */
  total: number
  /** 当前激活索引（0-based） */
  activeIndex: number
  className?: string
}

/**
 * 滑卡指示器（移植自 design/mobile.html .dotsrow）：
 * 多卡左右滑切换的页码，当前卡是长条，其余是小圆点。
 */
export function Dots({ total, activeIndex, className = '' }: DotsProps) {
  if (total <= 1) return null
  return (
    <View className={`dotsrow ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} className={`dotsrow__dot ${i === activeIndex ? 'dotsrow__dot--on' : ''}`} />
      ))}
    </View>
  )
}
