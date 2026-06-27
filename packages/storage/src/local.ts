import type { Card, CheckIn } from '@worthit/core'
import type { IStorage } from './types'
import { type KVDriver, webKVDriver } from './kv-driver'

const CARDS_KEY = 'worthit:cards'
const CHECKINS_KEY = 'worthit:checkins'

/**
 * 本地存储实现：小程序 Storage / H5 localStorage 通过注入的 KVDriver 兜住。
 *
 * 软删除语义：deleteCard / deleteCheckIn 不真删，置 deleted=true（为将来云同步保留墓碑，
 * 否则被删项会在同步时被对端推回）。loadCards / loadCheckIns 默认过滤掉已删项。
 */
export class LocalStorage implements IStorage {
  private driver: KVDriver

  constructor(driver: KVDriver = webKVDriver()) {
    this.driver = driver
  }

  async loadCards(): Promise<Card[]> {
    const all = await this.readAll<Card>(CARDS_KEY)
    return all.filter((c) => !c.deleted)
  }

  async saveCard(card: Card): Promise<void> {
    const all = await this.readAll<Card>(CARDS_KEY)
    const next = this.upsertById(all, card)
    await this.writeAll(CARDS_KEY, next)
  }

  async deleteCard(id: string): Promise<void> {
    const all = await this.readAll<Card>(CARDS_KEY)
    const next = this.markDeleted(all, id)
    await this.writeAll(CARDS_KEY, next)
  }

  async loadCheckIns(cardId: string): Promise<CheckIn[]> {
    const all = await this.readAll<CheckIn>(CHECKINS_KEY)
    return all.filter((c) => !c.deleted && c.cardId === cardId)
  }

  async saveCheckIn(checkIn: CheckIn): Promise<void> {
    const all = await this.readAll<CheckIn>(CHECKINS_KEY)
    const next = this.upsertById(all, checkIn)
    await this.writeAll(CHECKINS_KEY, next)
  }

  async deleteCheckIn(id: string): Promise<void> {
    const all = await this.readAll<CheckIn>(CHECKINS_KEY)
    const next = this.markDeleted(all, id)
    await this.writeAll(CHECKINS_KEY, next)
  }

  // —— 内部工具 ——

  private async readAll<T>(key: string): Promise<T[]> {
    const raw = await this.driver.get(key)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      // 数据损坏时返回空数组而非崩溃，避免存储读失败阻断整个应用
      console.warn(`[worthit:storage] 解析本地数据失败，key=${key}，已按空处理`)
      return []
    }
  }

  private writeAll<T>(key: string, list: T[]): Promise<void> {
    return this.driver.set(key, JSON.stringify(list))
  }

  private upsertById<T extends { id: string }>(list: T[], item: T): T[] {
    const idx = list.findIndex((x) => x.id === item.id)
    if (idx === -1) return [...list, item]
    const next = list.slice()
    next[idx] = item
    return next
  }

  private markDeleted<T extends { id: string; deleted?: boolean; updatedAt: number }>(
    list: T[],
    id: string,
  ): T[] {
    return list.map((x) =>
      x.id === id ? { ...x, deleted: true, _dirty: true, updatedAt: Date.now() } : x,
    )
  }
}
