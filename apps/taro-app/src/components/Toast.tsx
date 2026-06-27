import { useEffect, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import './Toast.scss'

interface ToastProps {
  /** 显示与否（受控）。从 false→true 触发弹入并启动自动隐藏计时 */
  show: boolean
  /** 大字（主文案，如「划算了!」「欢迎回来 👊」） */
  big: string
  /** 小字（副文案，可选） */
  small?: string
  /** 自动隐藏回调（调用方据此把 show 置 false） */
  onHide: () => void
  /** 停留时长 ms，默认 1800（对齐原型） */
  duration?: number
}

/**
 * 里程碑盖章式 Toast（移植自 design/prototype/checkin.html .toast）。
 *
 * 居中、黄底硬描边 + 偏移硬影 + 旋转 -4° + spring 缩放弹入，停留后自动消失。
 * 用于打卡瞬时高光（断卡回归 / 划算了 / 单价大跌 / 课包打满），不抢占票面常驻信息。
 * 纯 CSS 动画，四端通用。
 */
export function Toast({ show, big, small, onHide, duration = 1800 }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!show) return
    timerRef.current = setTimeout(onHide, duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [show, duration, onHide])

  return (
    <View className={`toast ${show ? 'toast--show' : ''}`} aria-live="polite">
      <Text className="toast__big">{big}</Text>
      {small && <Text className="toast__small">{small}</Text>}
    </View>
  )
}
