import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import './Stamp.scss'

/** 印章色调：默认白 / 警戒黄 / 省钱绿 / 烧钱红 / 警示橙 */
export type StampVariant = 'default' | 'alert' | 'save' | 'burn' | 'warn'

interface StampProps {
  /** 色调，对齐设计稿 stamp-* 变体 */
  variant?: StampVariant
  /** 盖歪一点（-3deg），强化「盖上去」的手感 */
  rotate?: boolean
  /** 可选前置图标（传 Icon 或任意节点），与文字间距由 .stamp 的 gap 统一 */
  icon?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * 印章标签：盖在小票上的状态印章（省/亏/警示/CTA 高亮）。
 * 纯展示、四端通用，色彩一律走 var(--c-*)，为主题切换留地基。
 */
export function Stamp({ variant = 'default', rotate, icon, className = '', children }: StampProps) {
  const cls = ['stamp', variant !== 'default' && `stamp-${variant}`, rotate && 'stamp-rot', className]
    .filter(Boolean)
    .join(' ')
  return (
    <View className={cls}>
      {icon}
      <Text>{children}</Text>
    </View>
  )
}
