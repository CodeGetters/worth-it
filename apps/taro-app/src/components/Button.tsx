import { Button as TaroButton } from '@tarojs/components'
import type { ITouchEvent } from '@tarojs/components'
import type { ReactNode } from 'react'
import './Button.scss'

/** 按钮色调：警戒黄(主CTA) / 墨黑 / 烧钱红(止损) / 幽灵白(弱操作) */
export type ButtonVariant = 'alert' | 'ink' | 'burn' | 'ghost'
/** 尺寸：常规 / 大(灵魂打卡按钮 62px) / 小(菜单内) */
export type ButtonSize = 'normal' | 'large' | 'small'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 撑满宽度，默认 true（打卡等主操作多为全宽） */
  block?: boolean
  disabled?: boolean
  /** 前置图标 */
  icon?: ReactNode
  className?: string
  onClick?: (e: ITouchEvent) => void
  children: ReactNode
}

/**
 * 小票按钮（移植自 design/mobile.html .btn）。
 * 标志性硬描边 + 偏移硬投影 + 按下回弹位移（盖章手感），色彩走 var(--c-*)。
 * 用 @tarojs/components Button 以获得跨端无障碍与小程序能力；默认边框已在 scss 清掉。
 */
export function Button({
  variant = 'alert',
  size = 'normal',
  block = true,
  disabled,
  icon,
  className = '',
  onClick,
  children,
}: ButtonProps) {
  const cls = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    block && 'btn--block',
    disabled && 'btn--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <TaroButton className={cls} disabled={disabled} onClick={disabled ? undefined : onClick}>
      {icon}
      {children}
    </TaroButton>
  )
}
