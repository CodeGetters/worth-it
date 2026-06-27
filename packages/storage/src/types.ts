import type { Card, CheckIn } from '@worthit/core'

/**
 * 存储统一接口（预留云的核心）。
 *
 * - 全部异步：本地存储也包成 Promise，将来接云不改调用方
 * - 业务层只调 IStorage，不直接碰 localStorage / Taro.setStorage → 切云只换一个实现
 */
export interface IStorage {
  loadCards(): Promise<Card[]>
  saveCard(card: Card): Promise<void>
  deleteCard(id: string): Promise<void>

  loadCheckIns(cardId: string): Promise<CheckIn[]>
  saveCheckIn(checkIn: CheckIn): Promise<void>
  deleteCheckIn(id: string): Promise<void>

  /** 将来云同步（本地实现可不提供） */
  sync?(): Promise<void>
  /** 将来绑定用户（本地实现可不提供） */
  bindUser?(userId: string): Promise<void>
}
