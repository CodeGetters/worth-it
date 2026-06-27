import { View } from '@tarojs/components'
import './ProgressBar.scss'

interface ProgressBarProps {
  /** 填充比例 0~1，组件内部 clamp 到 [0,1] */
  ratio: number
  /** 已达成（如已低于心里价）：填充切到警戒黄，对齐设计稿 .bar-fill.done */
  done?: boolean
  className?: string
}

/**
 * 小票进度条（移植自 design/mobile.html .bar / .bar-fill）。
 * 硬描边 + 圆角胶囊，填充宽度走 transition 平滑增长。用于「单价 vs 心里价」参照。
 */
export function ProgressBar({ ratio, done, className = '' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100
  return (
    <View className={`bar ${className}`}>
      <View className={`bar__fill ${done ? 'bar__fill--done' : ''}`} style={{ width: `${pct}%` }} />
    </View>
  )
}
