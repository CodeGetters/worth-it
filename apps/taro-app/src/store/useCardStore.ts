import { create } from 'zustand'
import type { Card, CheckIn } from '@worthit/core'
import { storage } from '../services/storage'
import { genId } from '../utils/id'
import { today as getToday, addYears } from '../utils/date'
import { t } from '../i18n'

/**
 * 卡片状态。
 *
 * 设计原则（见 TECH_PLAN / CLAUDE.md）：
 * - 只存原始数据（cards / checkins），所有派生数字（单价/回本/负反馈）由组件渲染时
 *   实时调 core 的 calcCard 现算，绝不入库——单一真相。
 * - 只走注入的 storage（IStorage），绝不直接碰 Taro.setStorage / localStorage。
 * - 每条记录写入时维护同步元信息（updatedAt / _dirty），接云前也维护。
 */
interface CardState {
  cards: Card[]
  checkins: CheckIn[]
  loading: boolean

  /** 从存储加载全部卡与打卡记录；空数据时种一张示例卡（首次甜头） */
  load: () => Promise<void>
  /** 打卡：给某卡新增一条打卡记录（默认今天，支持补卡传入日期） */
  checkIn: (cardId: string, date?: string) => Promise<void>
  /** 撤销：软删除一条打卡记录 */
  undoCheckIn: (checkInId: string) => Promise<void>
  /** 取某卡的打卡记录（已按 store 内存过滤软删除） */
  checkInsOf: (cardId: string) => CheckIn[]
}

/** 内存态也过滤软删除，避免组件看到墓碑记录 */
const alive = <T extends { deleted?: boolean }>(list: T[]) => list.filter((x) => !x.deleted)

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  checkins: [],
  loading: false,

  async load() {
    set({ loading: true })
    let cards = await storage.loadCards()

    // 空状态：种一张可直接玩的示例卡（健身年卡，对齐原型 ¥2000 / 不限次 / 心里价 150）
    if (cards.length === 0) {
      const purchaseDate = getToday()
      const demo: Card = {
        id: genId('card'),
        name: t('checkin.demoCardName'),
        totalPrice: 2000,
        type: 'unlimited',
        purchaseDate,
        expireDate: addYears(purchaseDate, 1),
        expectedPrice: 150,
        updatedAt: Date.now(),
        _dirty: true,
      }
      console.log(`[worthit:store] 空状态，种示例卡 cardId=${demo.id}`)
      await storage.saveCard(demo)
      cards = [demo]
    }

    // 加载所有卡的打卡记录
    const checkinLists = await Promise.all(cards.map((c) => storage.loadCheckIns(c.id)))
    set({ cards, checkins: checkinLists.flat(), loading: false })
  },

  async checkIn(cardId, date) {
    const record: CheckIn = {
      id: genId('ci'),
      cardId,
      date: date ?? getToday(),
      updatedAt: Date.now(),
      _dirty: true,
    }
    console.log(`[worthit:store] 打卡 cardId=${cardId} date=${record.date}`)
    await storage.saveCheckIn(record)
    set({ checkins: [...get().checkins, record] })
  },

  async undoCheckIn(checkInId) {
    console.log(`[worthit:store] 撤销打卡 checkInId=${checkInId}`)
    await storage.deleteCheckIn(checkInId)
    set({ checkins: get().checkins.filter((c) => c.id !== checkInId) })
  },

  checkInsOf(cardId) {
    return alive(get().checkins).filter((c) => c.cardId === cardId)
  },
}))
