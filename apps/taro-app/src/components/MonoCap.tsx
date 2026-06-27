import { Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import './MonoCap.scss'

interface MonoCapProps {
  /** 覆盖颜色（设计稿常内联成 var(--c-faint) 等弱化态） */
  color?: string
  className?: string
  children: ReactNode
}

/**
 * 等宽小标签 / 凭证编号风格文本（移植自 design/tokens.css .mono-cap）。
 * 收银机质感的小字：等宽数字字体 + 大字距 + 大写。用于次数标签、字段名、区块小标题。
 */
export function MonoCap({ color, className = '', children }: MonoCapProps) {
  return (
    <Text className={`mono-cap ${className}`} style={color ? { color } : undefined}>
      {children}
    </Text>
  )
}
