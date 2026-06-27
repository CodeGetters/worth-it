import { describe, it, expect } from 'vitest'
import { getBreakLevel, getStatus, getFeedback, detectTurningPoint } from './feedback'
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
