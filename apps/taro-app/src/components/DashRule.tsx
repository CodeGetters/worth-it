import { View } from '@tarojs/components'
import './DashRule.scss'

interface DashRuleProps {
  className?: string
}

/**
 * 小票虚线分隔线（移植自 design/tokens.css .dashrule）。
 * 小程序无 <hr>，用 View + border-top 实现，四端通用。
 */
export function DashRule({ className = '' }: DashRuleProps) {
  return <View className={`dashrule ${className}`} />
}
