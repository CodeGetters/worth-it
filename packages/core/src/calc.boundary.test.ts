import { describe, it, expect } from 'vitest'
import { calcCard } from './calc'
import type { Card, CheckIn } from './types'

function card(over: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    name: '健身年卡',
    totalPrice: 2000,
    type: 'unlimited',
    purchaseDate: '2026-01-01',
    expireDate: '2027-01-01',
    updatedAt: 0,
    ...over,
  }
}

let seq = 0
function ci(dates: string[], cardId = 'c1'): CheckIn[] {
  return dates.map((date) => ({ id: `s${seq++}`, cardId, date, updatedAt: 0 }))
}

describe('calcCard · 少样本不预测', () => {
  it('打卡<3次：样本不足，给出还差几次', () => {
    const r = calcCard(card(), ci(['2026-01-02', '2026-01-09']), '2026-02-01')
    expect(r.enoughSample).toBe(false)
    expect(r.checkInsToSample).toBe(1)
  })

  it('距购买<7天：即使打卡够3次，样本仍不足', () => {
    const r = calcCard(card(), ci(['2026-01-02', '2026-01-03', '2026-01-04']), '2026-01-05')
    expect(r.enoughSample).toBe(false)
  })

  it('打卡≥3次且距购买≥7天：样本充分', () => {
    const r = calcCard(card(), ci(['2026-01-02', '2026-01-05', '2026-01-08']), '2026-01-20')
    expect(r.enoughSample).toBe(true)
    expect(r.checkInsToSample).toBe(0)
  })
})

describe('calcCard · 过期与断卡', () => {
  it('今天晚于有效期 → expired', () => {
    expect(calcCard(card(), ci(['2026-06-01']), '2027-06-01').expired).toBe(true)
    expect(calcCard(card(), ci(['2026-06-01']), '2026-06-02').expired).toBe(false)
  })

  it('断卡天数 = 今天 − 最后一次打卡', () => {
    const r = calcCard(card(), ci(['2026-01-02', '2026-02-01']), '2026-02-17')
    expect(r.breakDays).toBe(16)
  })

  it('从未打卡：断卡天数为 null', () => {
    expect(calcCard(card(), [], '2026-02-01').breakDays).toBeNull()
  })

  it('日烧钱 = 总价 ÷ 有效期总天数（向上取整）', () => {
    // 2000 / 365 = 5.48 → 6
    const r = calcCard(card(), ci(['2026-02-01']), '2026-02-17')
    expect(r.dailyBurn).toBe(6)
    // 断卡 16 天 → 白扔 96
    expect(r.wastedByBreak).toBe(96)
  })
})

describe('calcCard · 心里价里程碑', () => {
  it('未填心里价：里程碑字段为 null/false', () => {
    const r = calcCard(card(), ci(['2026-01-02']), '2026-02-01')
    expect(r.belowExpected).toBe(false)
    expect(r.checkInsToExpected).toBeNull()
    expect(r.savedVsExpected).toBeNull()
  })

  it('单价低于心里价：belowExpected=true，缺口为 0', () => {
    // 2000/14 = 143 ≤ 150
    const r = calcCard(
      card({ expectedPrice: 150 }),
      ci(datesN(14, '2026-01-02')),
      '2026-03-01',
    )
    expect(r.belowExpected).toBe(true)
    expect(r.checkInsToExpected).toBe(0)
  })

  it('单价高于心里价：给出还需打几次（⌈2000/150⌉=14，已打8 → 还差6）', () => {
    const r = calcCard(card({ expectedPrice: 150 }), ci(datesN(8, '2026-01-02')), '2026-03-01')
    expect(r.belowExpected).toBe(false)
    expect(r.checkInsToExpected).toBe(6)
  })

  it('省下的钱 = (心里价 − 单价) × 次数', () => {
    // 单价 2000/10=200，心里价 150 → (150-200)*10 = -500（还在亏）
    const r = calcCard(card({ expectedPrice: 150 }), ci(datesN(10, '2026-01-02')), '2026-03-01')
    expect(r.savedVsExpected).toBe(-500)
  })
})

describe('calcCard · 非法日期严格兜底（dayjs strict）', () => {
  it('非法 expireDate（月份越界）：dayDiff→NaN，不误判过期、日烧钱回落到总价兜底', () => {
    const r = calcCard(card({ expireDate: '2026-13-40' }), ci(['2026-02-01']), '2026-02-17')
    expect(r.expired).toBe(false) // NaN>0 为 false，不会把非法日期误判成已过期
    expect(r.dailyBurn).toBe(2000) // totalDays 为 NaN → 回落 max(1, totalPrice)
  })

  it('非法格式日期（非 YYYY-MM-DD）被 strict 拒绝，不被 dayjs 容错纠正', () => {
    // '2026/01/02' 斜杠格式在 strict+customParseFormat 下视为非法 → 该打卡越界过滤掉
    const r = calcCard(card(), ci(['2026/01/02', '2026-02-01']), '2026-02-17')
    expect(r.checkInCount).toBe(1)
  })
})


function datesN(n: number, start: string): string[] {
  const base = Date.UTC(
    Number(start.slice(0, 4)),
    Number(start.slice(5, 7)) - 1,
    Number(start.slice(8, 10)),
  )
  return Array.from({ length: n }, (_, i) =>
    new Date(base + i * 86_400_000).toISOString().slice(0, 10),
  )
}
