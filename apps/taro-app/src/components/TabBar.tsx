import { View, Text } from '@tarojs/components'
import { Icon } from './Icon'
import './TabBar.scss'

/** tab key：打卡 / 总览 / 我的 */
export type TabKey = 'checkin' | 'overview' | 'me'

interface TabItem {
  key: TabKey
  label: string
  icon: Parameters<typeof Icon>[0]['name']
}

interface TabBarProps {
  /** 当前激活 tab */
  active: TabKey
  /** 切换回调（点已激活项不触发） */
  onChange?: (key: TabKey) => void
  /** 文案，由调用方从 i18n 传入（组件不直接依赖 i18n，保持纯展示） */
  labels: Record<TabKey, string>
}

const ITEMS: Omit<TabItem, 'label'>[] = [
  { key: 'checkin', icon: 'tabCheckin' },
  { key: 'overview', icon: 'tabOverview' },
  { key: 'me', icon: 'tabMe' },
]

/**
 * 底部导航（移植自 design/mobile.html .tabbar）。
 * 激活态：黄底黑边黑影（.tab.on）。三页随时互跳，固定屏底。
 */
export function TabBar({ active, onChange, labels }: TabBarProps) {
  return (
    <View className="tabbar">
      {ITEMS.map((it) => {
        const on = it.key === active
        return (
          <View
            key={it.key}
            className={`tabbar__tab ${on ? 'tabbar__tab--on' : ''}`}
            onClick={on ? undefined : () => onChange?.(it.key)}
          >
            <Icon name={it.icon} size={22} strokeWidth={2.2} color={on ? 'var(--c-ink)' : 'var(--c-mute)'} />
            <Text>{labels[it.key]}</Text>
          </View>
        )
      })}
    </View>
  )
}
