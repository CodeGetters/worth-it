import { describe, it, expect } from 'vitest'
import { calcCard } from './calc'
import type { Card, CheckIn } from './types'

// —— 测试工具：少写样板 ——

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
function checkIns(cardId: string, dates: string[]): CheckIn[] {
  return dates.map((date) => ({ id: `ci${seq++}`, cardId, date, updatedAt: 0 }))
}

describe('calcCard · 真实单价与除零兜底', () => {
  it('未打卡时单价为 null（除零兜底，不显天价）', () => {
    const r = calcCard(card(), [], '2026-02-01')
    expect(r.realUnitCost).toBeNull()
    expect(r.checkInCount).toBe(0)
  })

  it('打卡后单价 = 总价 ÷ 次数（四舍五入）', () => {
    // 2000 / 8 = 250
    const r = calcCard(card(), checkIns('c1', dates(8, '2026-01-02')), '2026-03-01')
    expect(r.checkInCount).toBe(8)
    expect(r.realUnitCost).toBe(250)
  })

  it('只统计本卡的有效打卡（过滤软删除与他卡）', () => {
    const list: CheckIn[] = [
      ...checkIns('c1', ['2026-01-02', '2026-01-03']),
      { id: 'del', cardId: 'c1', date: '2026-01-04', updatedAt: 0, deleted: true },
      ...checkIns('other', ['2026-01-05']),
    ]
    const r = calcCard(card(), list, '2026-03-01')
    expect(r.checkInCount).toBe(2)
  })

  it('补卡越界不计入：早于购买日或晚于今天的记录被丢弃', () => {
    const list = checkIns('c1', ['2025-12-31', '2026-01-02', '2099-01-01'])
    const r = calcCard(card(), list, '2026-03-01')
    expect(r.checkInCount).toBe(1) // 只有 2026-01-02 有效
  })
})

describe('calcCard · 有限次课包', () => {
  const pack = () =>
    card({ type: 'limited', totalPrice: 4080, totalTimes: 40, name: '私教课包' })

  it('剩余次数与单价：用 10/40，¥408/节', () => {
    const r = calcCard(pack(), checkIns('c1', dates(10, '2026-01-02')), '2026-03-01')
    expect(r.realUnitCost).toBe(408)
    expect(r.remainingTimes).toBe(30)
    expect(r.full).toBe(false)
  })

  it('打满冻结：超总次数的打卡不撑大分母，full=true，剩余=0', () => {
    const r = calcCard(pack(), checkIns('c1', dates(45, '2026-01-02')), '2026-06-01')
    expect(r.checkInCount).toBe(40) // 封顶 40，不到 45
    expect(r.full).toBe(true)
    expect(r.remainingTimes).toBe(0)
    expect(r.realUnitCost).toBe(102) // 4080 / 40
  })

  it('到期未用浪费 = 未用次数/总次数×总价；用10/40过期 → 浪费 3060', () => {
    const r = calcCard(pack(), checkIns('c1', dates(10, '2026-01-02')), '2027-06-01')
    expect(r.expired).toBe(true)
    expect(r.wastedUnused).toBe(3060) // 30/40 * 4080
  })

  it('未过期时不算浪费（还能再用）', () => {
    const r = calcCard(pack(), checkIns('c1', dates(10, '2026-01-02')), '2026-03-01')
    expect(r.wastedUnused).toBe(0)
  })

  it('不限次卡无剩余次数、无浪费', () => {
    const r = calcCard(card(), checkIns('c1', dates(5, '2026-01-02')), '2026-03-01')
    expect(r.remainingTimes).toBeNull()
    expect(r.full).toBe(false)
    expect(r.wastedUnused).toBe(0)
  })
})

/** 从某天起连续 n 天生成日期数组（用于批量打卡） */
function dates(n: number, start: string): string[] {
  const base = Date.UTC(
    Number(start.slice(0, 4)),
    Number(start.slice(5, 7)) - 1,
    Number(start.slice(8, 10)),
  )
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base + i * 86_400_000)
    return d.toISOString().slice(0, 10)
  })
}
