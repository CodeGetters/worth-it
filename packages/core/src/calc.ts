/**
 * 核心计算：卡 + 打卡记录 → 所有派生「数字事实」。
 *
 * 原则（见 TECH_PLAN.md）：
 * - 纯函数、无副作用、不碰时间——「今天」始终作参数 today 传入，绝不读取系统当前时间，
 *   保证 node/浏览器/小程序/将来后端结果一致、可测。日期运算走 dayjs.utc（不碰本地时区）。
 * - 只产数字与标志位，不产文案/颜色/动画（那是 UI 的事，见 feedback.ts）。
 * - 计算边界全部兜底：除零、有限次冻结、过期、少样本、补卡越界（见 README「计算边界兜底」）。
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { Card, CheckIn, CalcResult } from './types'

// 全程走 UTC，避免本地时区/夏令时导致跨端天差 off-by-one（四端结果必须一致）。
// customParseFormat + strict 模式保证只接受合法的 YYYY-MM-DD，非法日期不被「容错」纠正。
dayjs.extend(utc)
dayjs.extend(customParseFormat)

/** 少样本阈值：打卡次数下限（含），低于此不给预测 */
const MIN_SAMPLE_COUNT = 3

// ——————————————————— 纯日期工具（dayjs.utc，不碰本地时区）———————————————————

/** 严格解析 YYYY-MM-DD 为 UTC dayjs；非法返回 invalid 实例（isValid()===false） */
function parseDate(ymd: string): dayjs.Dayjs {
  return dayjs.utc(ymd, 'YYYY-MM-DD', true)
}

/** a − b 的整数天差（a、b 均为 YYYY-MM-DD）；任一非法返回 NaN */
function dayDiff(a: string, b: string): number {
  const da = parseDate(a)
  const db = parseDate(b)
  if (!da.isValid() || !db.isValid()) return NaN
  return da.diff(db, 'day')
}

/** 取该卡有效打卡记录（过滤软删除 + 非法日期 + 越界：早于购买日或晚于今天的脏数据不计入） */
function validCheckIns(card: Card, checkIns: CheckIn[], today: string): CheckIn[] {
  return checkIns.filter((c) => {
    if (c.deleted || c.cardId !== card.id) return false
    if (!parseDate(c.date).isValid()) return false // 非法日期：脏数据，不计入分母（否则虚降单价）
    if (dayDiff(c.date, card.purchaseDate) < 0) return false // 早于办卡日，越界
    if (dayDiff(today, c.date) < 0) return false // 晚于今天，越界
    return true
  })
}

// ——————————————————————————— 主计算 ———————————————————————————

/**
 * 计算一张卡的真实单价等全部派生数字。
 * @param card     卡
 * @param checkIns 打卡记录（可含其他卡/已删/越界项，内部自行过滤）
 * @param today    今天（YYYY-MM-DD），作参数传入以保证纯函数可测
 */
export function calcCard(card: Card, checkIns: CheckIn[], today: string): CalcResult {
  const isLimited = card.type === 'limited'
  const totalTimes = isLimited ? (card.totalTimes ?? 0) : null

  // 有效打卡次数（已过滤软删除/越界）。有限次卡按总次数封顶，杜绝第 N+1 次脏数据撑大分母
  const valid = validCheckIns(card, checkIns, today)
  const rawCount = valid.length
  const checkInCount =
    isLimited && totalTimes ? Math.min(rawCount, totalTimes) : rawCount

  // 真实单价：除零兜底——未打卡返回 null，UI 显破折号而非天价
  const realUnitCost = checkInCount > 0 ? Math.round(card.totalPrice / checkInCount) : null

  // 有限次状态
  const remainingTimes =
    isLimited && totalTimes ? Math.max(0, totalTimes - checkInCount) : null
  const full = isLimited && totalTimes ? checkInCount >= totalTimes : false

  // 过期判定：今天晚于有效期截止日
  const expired = dayDiff(today, card.expireDate) > 0

  // 样本充分性：打卡次数 ≥ 3 即可给预测。
  // 不再设「距购买 ≥ N 天」门槛——否则当天办卡、当天连打多次的用户看不到任何单价，
  // 而「打一次看单价掉一截」正是核心爽点。防天价由「≥3 次」本身兜住（单次不预测）。
  const enoughSample = checkInCount >= MIN_SAMPLE_COUNT
  const checkInsToSample = Math.max(0, MIN_SAMPLE_COUNT - checkInCount)

  // 断卡天数：今天 − 最后一次打卡日；从未打卡为 null
  const breakDays = computeBreakDays(valid, today)

  // 日烧钱：总价 ÷ 有效期总天数（向上取整，下限 1，防极短有效期或脏数据）
  const totalDays = dayDiff(card.expireDate, card.purchaseDate)
  const dailyBurn =
    Number.isNaN(totalDays) || totalDays <= 0
      ? Math.max(1, Math.round(card.totalPrice))
      : Math.max(1, Math.ceil(card.totalPrice / totalDays))
  const wastedByBreak = breakDays && breakDays > 0 ? dailyBurn * breakDays : 0

  // 心里价里程碑
  const expected = card.expectedPrice
  const belowExpected =
    expected != null && realUnitCost != null && realUnitCost <= expected
  const checkInsToExpected = computeCheckInsToExpected(
    card,
    expected,
    checkInCount,
    belowExpected,
  )

  // 省下的钱 = (心里价 − 真实单价) × 已打卡次数；无心里价或未打卡为 null
  const savedVsExpected =
    expected != null && realUnitCost != null
      ? (expected - realUnitCost) * checkInCount
      : null

  // 到期未用浪费 = 未用次数 ÷ 总次数 × 总价（仅有限次、仅过期后才计；未过期视作还能再用）
  const wastedUnused =
    isLimited && totalTimes && expired && remainingTimes && remainingTimes > 0
      ? Math.round((remainingTimes / totalTimes) * card.totalPrice)
      : 0

  return {
    realUnitCost,
    checkInCount,
    expired,
    remainingTimes,
    full,
    enoughSample,
    checkInsToSample,
    breakDays,
    dailyBurn,
    wastedByBreak,
    belowExpected,
    checkInsToExpected,
    savedVsExpected,
    wastedUnused,
  }
}

/** 断卡天数 = 今天 − 最后一次打卡日；从未打卡返回 null */
function computeBreakDays(valid: CheckIn[], today: string): number | null {
  if (valid.length === 0) return null
  let latest = valid[0].date
  for (const c of valid) {
    if (dayDiff(c.date, latest) > 0) latest = c.date
  }
  const d = dayDiff(today, latest)
  return Number.isNaN(d) ? null : Math.max(0, d)
}

/**
 * 还需再打几次，单价才低于心里价。
 * 单价 = 总价/次数 ≤ 心里价 ⟺ 次数 ≥ ⌈总价/心里价⌉。
 * 已达标返回 0；无心里价（或非正）返回 null。有限次卡用总次数封顶——
 * 若打满都到不了心里价，缺口按「打到满」算（UI 可据此提示这卡注定不划算）。
 */
function computeCheckInsToExpected(
  card: Card,
  expected: number | undefined,
  checkInCount: number,
  belowExpected: boolean,
): number | null {
  if (expected == null || expected <= 0) return null
  if (belowExpected) return 0
  let targetCount = Math.ceil(card.totalPrice / expected)
  if (card.type === 'limited' && card.totalTimes) {
    targetCount = Math.min(card.totalTimes, targetCount)
  }
  return Math.max(0, targetCount - checkInCount)
}
