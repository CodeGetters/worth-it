import { describe, it, expect } from 'vitest'
import {
  getBreakLevel,
  getStatus,
  getFeedback,
  detectTurningPoint,
  getReviewVerdict,
} from './feedback'
import type { CalcResult } from './types'

/** 构造一个「正常态」CalcResult，测试时只覆盖关心的字段 */
function result(over: Partial<CalcResult> = {}): CalcResult {
  return {
    realUnitCost: 200,
    checkInCount: 10,
    expired: false,
    remainingTimes: null,
    full: false,
    enoughSample: true,
    checkInsToSample: 0,
    breakDays: 0,
    dailyBurn: 6,
    wastedByBreak: 0,
    belowExpected: false,
    checkInsToExpected: null,
    savedVsExpected: null,
    wastedUnused: 0,
    ...over,
  }
}

describe('getBreakLevel · 负反馈四档递进', () => {
  it.each([
    [0, 'none'],
    [2, 'none'],
    [3, 'mild'],
    [6, 'mild'],
    [7, 'number'],
    [14, 'number'],
    [15, 'harsh'],
    [20, 'harsh'],
    [21, 'stop'],
    [60, 'stop'],
  ] as const)('断卡 %i 天 → %s', (days, level) => {
    expect(getBreakLevel(result({ breakDays: days }))).toBe(level)
  })

  it('从未打卡（breakDays=null）→ none', () => {
    expect(getBreakLevel(result({ breakDays: null }))).toBe('none')
  })
})

describe('getStatus · 总览着色', () => {
  it('过期 → review（待复盘，灰）', () => {
    expect(getStatus(result({ expired: true, breakDays: 30 }))).toBe('review')
  })

  it('断卡进入负反馈 → burning（在亏，红）', () => {
    expect(getStatus(result({ breakDays: 10 }))).toBe('burning')
  })

  it('正常打卡 → active（在用，绿）', () => {
    expect(getStatus(result({ breakDays: 1 }))).toBe('active')
  })

  it('getFeedback 聚合 status 与 breakLevel', () => {
    const fb = getFeedback(result({ breakDays: 16 }))
    expect(fb).toEqual({ status: 'burning', breakLevel: 'harsh' })
  })
})

describe('detectTurningPoint · 转折判定', () => {
  it('断卡回归 → welcomeBack（优先级最高）', () => {
    const before = result({ breakDays: 10 })
    const after = result({ breakDays: 0 })
    expect(detectTurningPoint(before, after)).toBe('welcomeBack')
  })

  it('断卡回归同时跨心里价 → 仍 welcomeBack（优先）', () => {
    const before = result({ breakDays: 8, belowExpected: false })
    const after = result({ breakDays: 0, belowExpected: true })
    expect(detectTurningPoint(before, after)).toBe('welcomeBack')
  })

  it('课包打满 → fullPaid（优先级最高）', () => {
    const before = result({ full: false })
    const after = result({ full: true, belowExpected: true })
    expect(detectTurningPoint(before, after)).toBe('fullPaid')
  })

  it('跨过心里价 → becameGoodDeal', () => {
    const before = result({ belowExpected: false, realUnitCost: 160 })
    const after = result({ belowExpected: true, realUnitCost: 145 })
    expect(detectTurningPoint(before, after)).toBe('becameGoodDeal')
  })

  it('单次大跌（≥60）→ bigDrop', () => {
    const before = result({ realUnitCost: 250 })
    const after = result({ realUnitCost: 180 })
    expect(detectTurningPoint(before, after)).toBe('bigDrop')
  })

  it('小幅下降不触发转折 → none', () => {
    const before = result({ realUnitCost: 210 })
    const after = result({ realUnitCost: 200 })
    expect(detectTurningPoint(before, after)).toBe('none')
  })
})

describe('getReviewVerdict · 到期复盘结论', () => {
  it('从未打卡 → notWorth', () => {
    expect(getReviewVerdict(result({ checkInCount: 0, realUnitCost: null }))).toBe('notWorth')
  })

  it('有心里价 · 单价 ≤ 心里价 → worthIt', () => {
    // 单价 21，心里价 150
    expect(getReviewVerdict(result({ realUnitCost: 21, checkInCount: 96 }), 2000, 150)).toBe(
      'worthIt',
    )
  })

  it('有心里价 · 单价 > 心里价×2 → notWorth', () => {
    // 单价 408，心里价 150（>300）
    expect(getReviewVerdict(result({ realUnitCost: 408, checkInCount: 10 }), 16000, 150)).toBe(
      'notWorth',
    )
  })

  it('有心里价 · 单价在心里价与其2倍之间 → soso', () => {
    // 单价 200，心里价 150（150~300 之间）
    expect(getReviewVerdict(result({ realUnitCost: 200, checkInCount: 10 }), 2000, 150)).toBe('soso')
  })

  it('有限次卡 · 到期未用浪费 ≥ 总价一半 → notWorth（优先于单价判定）', () => {
    // 即便单价低于心里价，浪费过半仍判不值
    expect(
      getReviewVerdict(
        result({ realUnitCost: 100, checkInCount: 5, wastedUnused: 1500 }),
        3000,
        150,
      ),
    ).toBe('notWorth')
  })

  it('无心里价 · 打卡次数 ≥ 20 → worthIt', () => {
    expect(getReviewVerdict(result({ checkInCount: 25, checkInsToExpected: null }))).toBe('worthIt')
  })

  it('无心里价 · 打卡次数少 → soso', () => {
    expect(getReviewVerdict(result({ checkInCount: 5, checkInsToExpected: null }))).toBe('soso')
  })
})
