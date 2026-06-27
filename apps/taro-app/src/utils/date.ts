/**
 * 时间工具：把「取今天」的副作用锁在 app 边界。
 *
 * core 是纯函数、不碰时间（today 作参数传入）。读真实时间这件事只在 app 层做一次，
 * 取到 YYYY-MM-DD 后传给 calcCard，core 依旧可测、四端一致。
 *
 * 时区分工：这里用本地时区 dayjs()（用户感知的「今天」），core 内部用 dayjs.utc 做纯天差计算，
 * 两层各取所需、互不干扰——app 决定「今天是几号」，core 决定「相差几天」。
 */
import dayjs from 'dayjs'

/** 今天（本地时区，YYYY-MM-DD） */
export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * ymd + n 年（用于年卡默认有效期：购买日 +1 年）。入参出参均 YYYY-MM-DD。
 * 闰年安全：2024-02-29 + 1 年 → 2025-02-28（dayjs 自动归位，不会产生不存在的日期）。
 */
export function addYears(ymd: string, n: number): string {
  return dayjs(ymd).add(n, 'year').format('YYYY-MM-DD')
}
