import { useEffect, useRef, useState } from 'react'

/**
 * 数字滚动动画（打卡灵魂）：从旧值滚到新值，等宽字不抖位。
 *
 * 不依赖 requestAnimationFrame（小程序逻辑层没有），用 setTimeout 逐帧 + ease-out cubic，
 * 四端通用、自己掌控（见 TECH_PLAN 动效策略「两端都自己掌控，不赌库」）。
 * 尊重 prefers-reduced-motion / 无障碍：直接落终值。
 *
 * @param target  目标数字（null 时不滚，原样透传给调用方处理破折号）
 * @param duration 时长 ms
 * @returns 当前帧应显示的数字（target 为 null 时返回 null）
 */
export function useRollNumber(target: number | null, duration = 650): number | null {
  const [display, setDisplay] = useState<number | null>(target)
  const fromRef = useRef<number | null>(target)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const from = fromRef.current

    // null 边界 / 无变化：直接落值，不动画
    if (target == null || from == null || from === target) {
      setDisplay(target)
      fromRef.current = target
      return
    }

    // 无障碍：跳过动画
    const reduceMotion =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as { matchMedia?: unknown }).matchMedia === 'function' &&
      (globalThis as { matchMedia: (q: string) => { matches: boolean } }).matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
    if (reduceMotion) {
      setDisplay(target)
      fromRef.current = target
      return
    }

    const start = Date.now()
    const ease = (p: number) => 1 - Math.pow(1 - p, 3) // ease-out cubic

    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration)
      const v = Math.round(from + (target - from) * ease(p))
      setDisplay(v)
      if (p < 1) {
        timerRef.current = setTimeout(tick, 16)
      } else {
        setDisplay(target)
        fromRef.current = target
      }
    }
    tick()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      fromRef.current = target // 动画被打断时，下次从当前目标续起
    }
  }, [target, duration])

  return display
}
