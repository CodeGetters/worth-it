import { View, Text } from '@tarojs/components'
import { Icon } from './Icon'
import { Button } from './Button'
import './EmptyState.scss'

interface EmptyStateProps {
  /** 主文案（如「还没有卡」） */
  title: string
  /** 副说明（可选） */
  hint?: string
  /** 行动按钮文案（如「添加第一张卡」） */
  actionText: string
  /** 点行动按钮 */
  onAction: () => void
}

/**
 * 空数据态（移植自 design/mobile.html 空态）。
 *
 * 虚线方框 + 加号 + 引导文案 + 黄行动按钮，小票风。
 * 用于总览/打卡屏无卡时（如删光所有卡后）。
 */
export function EmptyState({ title, hint, actionText, onAction }: EmptyStateProps) {
  return (
    <View className="empty">
      <View className="empty__box">
        <Icon name="plus" size={32} strokeWidth={2.4} color="var(--c-faint)" />
        <Text className="empty__title">{title}</Text>
        {hint && <Text className="empty__hint">{hint}</Text>}
      </View>
      <Button variant="alert" block={false} onClick={onAction}>
        {actionText}
      </Button>
    </View>
  )
}
