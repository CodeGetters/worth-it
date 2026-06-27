import { describe, it, expect } from 'vitest'
import type { Card } from './types'

/**
 * 冒烟测试：验证测试工具链可运行、类型可导入。
 * 真正的 calcCard / feedback 单测随 core 业务逻辑落地时补充。
 */
describe('core 脚手架', () => {
  it('类型可正常构造', () => {
    const card: Card = {
      id: 'demo',
      name: '健身年卡',
      totalPrice: 2000,
      type: 'unlimited',
      purchaseDate: '2026-06-26',
      expireDate: '2027-06-26',
      updatedAt: 0,
    }
    expect(card.totalPrice).toBe(2000)
  })
})
