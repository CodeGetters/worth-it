import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import './LineItem.scss'

interface LineItemProps {
  /** 左侧标签 */
  label: ReactNode
  /** 右侧数值（等宽字呈现） */
  value: ReactNode
  /** 数值颜色（如 var(--c-save) 省钱绿、var(--c-burn) 烧钱红） */
  valueColor?: string
  /** 结论行：左标签加粗变黑，用于「最终每次只花」等总结 */
  emphasize?: boolean
  className?: string
}

/**
 * 小票账目行（移植自 design/tokens.css .line-item）：
 * 左标签 — 中间点线填充 — 右数值，点线对齐的收据账目质感。
 */
export function LineItem({ label, value, valueColor, emphasize, className = '' }: LineItemProps) {
  return (
    <View className={`line-item ${className}`}>
      <Text className={`line-item__k ${emphasize ? 'line-item__k--emphasize' : ''}`}>{label}</Text>
      <View className="line-item__fill" />
      <Text className="line-item__v" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </Text>
    </View>
  )
}
