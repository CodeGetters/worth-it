import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { Tear } from './Tear'
import './Ticket.scss'

/** 票面色调：常规 / 断卡红框 / 选中黄底 / 待复盘虚线灰 */
export type TicketTone = 'normal' | 'burn' | 'alert' | 'review'

interface TicketProps {
  tone?: TicketTone
  /** 扁平态：无硬投影，用于列表项/网格小卡 */
  flat?: boolean
  /** 带撕齿咬口（上下沿），强化票感。默认 false */
  toothed?: boolean
  className?: string
  children: ReactNode
}

/** 票面卡片背景色（撕齿齿色须与之一致，才能咬出纸形） */
const TONE_BG: Record<TicketTone, string> = {
  normal: 'var(--c-card)',
  burn: 'var(--c-card)',
  review: 'var(--c-card)',
  alert: 'var(--c-alert)',
}

/**
 * 票面容器（移植自 design/mobile.html .ticket）：硬描边 + 偏移硬投影的实体票感。
 * 状态色调（断卡红框 / 选中黄底 / 待复盘虚线）收敛为 tone props，不外露内联 style。
 */
export function Ticket({ tone = 'normal', flat, toothed, className = '', children }: TicketProps) {
  const cls = ['ticket', `ticket--${tone}`, flat && 'ticket--flat', className]
    .filter(Boolean)
    .join(' ')
  const tearColor = TONE_BG[tone]
  return (
    <View className={cls}>
      {toothed && <Tear position="top" color={tearColor} />}
      <View className="ticket__body">{children}</View>
      {toothed && <Tear position="bottom" color={tearColor} />}
    </View>
  )
}
