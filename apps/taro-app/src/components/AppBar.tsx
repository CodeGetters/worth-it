import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import './AppBar.scss'

interface AppBarProps {
  /** 标题文字（brand 区） */
  title: string
  /** 左侧显示返回箭头（子页用）；不传则显示品牌 logo */
  showBack?: boolean
  /** 返回点击 */
  onBack?: () => void
  /** 右侧操作区（通常是一个 icon-btn），不传则占位保持标题居中 */
  right?: ReactNode
}

/**
 * 顶部栏（移植自 design/mobile.html .appbar）。
 * 两种形态：首页 = logo + 标题 + 右操作；子页 = 返回箭头 + 居中标题 + 右占位。
 */
export function AppBar({ title, showBack, onBack, right }: AppBarProps) {
  if (showBack) {
    return (
      <View className="appbar">
        <View className="icon-btn" onClick={onBack}>
          <Icon name="chevronLeft" strokeWidth={2.4} color="var(--c-ink-2)" />
        </View>
        <Text className="appbar__brand appbar__brand--center">{title}</Text>
        <View className="appbar__spacer" />
      </View>
    )
  }
  return (
    <View className="appbar">
      <View className="appbar__brand">
        <View className="appbar__logo">
          <Icon name="logo" size={18} strokeWidth={2.4} color="var(--c-alert)" />
        </View>
        <Text>{title}</Text>
      </View>
      {right ?? <View className="appbar__spacer" />}
    </View>
  )
}

interface IconButtonProps {
  name: Parameters<typeof Icon>[0]['name']
  ariaLabel: string
  onClick?: () => void
}

/** appbar 右侧图标按钮（如「+」添加、帮助），44px 触摸目标 */
export function IconButton({ name, ariaLabel, onClick }: IconButtonProps) {
  return (
    <View className="icon-btn" aria-label={ariaLabel} role="button" onClick={onClick}>
      <Icon name={name} strokeWidth={2.4} color="var(--c-ink-2)" />
    </View>
  )
}
