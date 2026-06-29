import { View, Text } from '@tarojs/components'
import { Button } from './Button'
import './ConfirmDialog.scss'

interface ConfirmDialogProps {
  /** 显示与否（受控） */
  show: boolean
  /** 主标题（如「撤销上一次打卡?」） */
  title: string
  /** 副说明（可选，解释后果） */
  message?: string
  /** 确认按钮文案，默认「确定」 */
  confirmText?: string
  /** 取消按钮文案，默认「取消」 */
  cancelText?: string
  /** 确认按钮色调：默认警戒黄；危险操作（删除）用 burn 红 */
  danger?: boolean
  /** 点确认 */
  onConfirm: () => void
  /** 点取消 / 点遮罩 */
  onCancel: () => void
}

/**
 * 小票风确认弹窗（自建，零依赖）。
 *
 * 遮罩 + 居中票面（硬描边 + 偏移硬影），与 Toast/Ticket 同一套「清醒小票」语言。
 * 用于危险/不可逆操作前的二次确认（撤销打卡、删卡等）。纯 CSS 动画，四端通用。
 */
export function ConfirmDialog({
  show,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!show) return null
  return (
    <View className="confirm" aria-modal="true">
      {/* 遮罩：点击取消 */}
      <View className="confirm__mask" onClick={onCancel} />
      <View className="confirm__card">
        <Text className="confirm__title">{title}</Text>
        {message && <Text className="confirm__msg">{message}</Text>}
        <View className="confirm__actions">
          <Button variant="ghost" size="small" block={false} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'burn' : 'alert'}
            size="small"
            block={false}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </View>
  )
}
