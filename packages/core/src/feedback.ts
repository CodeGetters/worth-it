/**
 * 反馈逻辑：状态分级 / 负反馈递进 / 转折判定。
 *
 * 纯函数，消费 calcCard 产出的 CalcResult，只输出离散状态枚举——
 * 不产任何人话文案、颜色、动画。UI 拿枚举去映射各端文案（文案可分端微调，
 * 判定四端一致，见 README「负反馈随断卡天数递进」与 TODO「防沉没成本陷阱」）。
 */
import type { CalcResult, FeedbackResult, BreakLevel, CardStatus, TurningPoint } from './types'

/** 断卡分档阈值（天），与 README/TODO 对齐 */
const BREAK_MILD = 3 // 3-6 温和
const BREAK_NUMBER = 7 // 7-14 给数字
const BREAK_HARSH = 15 // 15-20 扎心
const BREAK_STOP = 21 // 21+ 止损

/** 大跌阈值（元）：单次降幅 ≥ 此值算「掉了一大截」，触发庆祝（与原型 60 对齐） */
const BIG_DROP = 60

/**
 * 断卡负反馈档位。未断卡 / 从未打卡 / 今天打过 → none。
 * 注意：止损（stop）优先于其他档，UI 据此切「接受沉没成本」语气。
 */
export function getBreakLevel(result: CalcResult): BreakLevel {
  const d = result.breakDays
  if (d == null || d < BREAK_MILD) return 'none'
  if (d >= BREAK_STOP) return 'stop'
  if (d >= BREAK_HARSH) return 'harsh'
  if (d >= BREAK_NUMBER) return 'number'
  return 'mild'
}

/**
 * 整体状态（总览着色）：
 * - review  待复盘（灰）：已过期，引导去复盘
 * - burning 在亏（红）：断卡进入负反馈（mild 及以上）
 * - active  在用（绿）：其余正常态
 */
export function getStatus(result: CalcResult): CardStatus {
  if (result.expired) return 'review'
  if (getBreakLevel(result) !== 'none') return 'burning'
  return 'active'
}

/** 反馈聚合：状态 + 断卡档位 */
export function getFeedback(result: CalcResult): FeedbackResult {
  return {
    status: getStatus(result),
    breakLevel: getBreakLevel(result),
  }
}

/**
 * 转折判定：对比「打卡前后两次 calcCard 结果」，得出该弹什么庆祝/提示。
 * 由 UI 在打卡动作里调用（打卡前算一次 before，打卡后算一次 after）。
 * 优先级：打满 > 跨过心里价 > 单次大跌 > 无。
 */
export function detectTurningPoint(before: CalcResult, after: CalcResult): TurningPoint {
  // 课包打满：这一打把最后一次用掉
  if (!before.full && after.full) return 'fullPaid'
  // 跨过心里价：从「还贵」变「划算」
  if (!before.belowExpected && after.belowExpected) return 'becameGoodDeal'
  // 单次大跌：单价降幅 ≥ 阈值
  if (
    before.realUnitCost != null &&
    after.realUnitCost != null &&
    before.realUnitCost - after.realUnitCost >= BIG_DROP
  ) {
    return 'bigDrop'
  }
  return 'none'
}
