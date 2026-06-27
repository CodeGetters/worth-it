import { View, Text } from '@tarojs/components'
import { useRollNumber } from '../hooks/useRollNumber'
import './PriceDisplay.scss'

/** 大单价色调：常规墨黑 / 省钱绿(已划算) / 烧钱红(断卡) */
export type PriceTone = 'normal' | 'save' | 'burn'

interface PriceDisplayProps {
  /** 目标单价（元）。null = 未打卡/除零，显破折号而非天价（计算边界兜底） */
  value: number | null
  tone?: PriceTone
  /** 是否开启数字滚动动画（打卡灵魂）。少样本占位等场景可关 */
  animate?: boolean
  /** 货币符号，默认 ¥ */
  currency?: string
  /** 单位后缀，如「/ 次」。不传则不显示 */
  unit?: string
  className?: string
}

/**
 * 灵魂大单价（移植自 design/mobile.html .price）：超大等宽数字怼脸，收银机质感。
 * 内部自带数字滚动（useRollNumber，四端通用、不赌库），value 变化时从旧值平滑滚到新值。
 * value 为 null（未打卡）时显破折号——绝不显天价，对齐 README「除零兜底」。
 */
export function PriceDisplay({
  value,
  tone = 'normal',
  animate = true,
  currency = '¥',
  unit,
  className = '',
}: PriceDisplayProps) {
  // animate=false 时直接落值（target 传 null 给 hook 会被当作破折号，故仍传 value 但忽略中间帧）
  const rolled = useRollNumber(animate ? value : null)
  const display = animate ? rolled : value

  const cls = ['price', tone !== 'normal' && `price--${tone}`, className].filter(Boolean).join(' ')
  return (
    <View className={cls}>
      <Text className="price__cur">{currency}</Text>
      <Text className="price__val">{display ?? '—'}</Text>
      {unit && <Text className="price__unit">{unit}</Text>}
    </View>
  )
}
