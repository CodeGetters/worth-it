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
/** 顶层视图（底部 tab + 添加表单 + 复盘）：打卡屏 / 总览屏 / 添加卡 / 到期复盘。 */
export type ViewTab = 'checkin' | 'overview' | 'add' | 'review'

/** 添加卡表单产出的卡字段：业务字段由用户填，id 与同步元信息由 store 补 */
export type NewCardInput = Omit<Card, 'id' | 'updatedAt' | 'deleted' | '_dirty'>

interface CardState {
  cards: Card[]
  checkins: CheckIn[]
  loading: boolean

  // —— UI 态（不持久化、不入库）：当前视图与当前选中卡 ——
  /** 当前视图（打卡 / 总览 / 添加 / 复盘），由底部 tab、+ 入口或复盘入口切换 */
  activeTab: ViewTab
  /** 当前选中卡 id（打卡屏渲染哪张 / 总览点卡定位）；空表示未选 */
  activeCardId: string | null
  /** 正在复盘的卡 id（复盘屏渲染哪张）；空表示未进复盘 */
  reviewCardId: string | null
  /** 续卡预填：进添加表单时用上期卡信息预填；null 为全新空表单 */
  prefillCard: NewCardInput | null

  /** 从存储加载全部卡与打卡记录；空数据时种一张示例卡（首次甜头） */
  load: () => Promise<void>
  /** 打卡：给某卡新增一条打卡记录（默认今天，支持补卡传入日期） */
  checkIn: (cardId: string, date?: string) => Promise<void>
  /** 撤销：软删除一条打卡记录 */
  undoCheckIn: (checkInId: string) => Promise<void>
  /** 取某卡的打卡记录（已按 store 内存过滤软删除） */
  checkInsOf: (cardId: string) => CheckIn[]
  /** 添加卡：补 id 与同步元信息后入库，新卡成为当前卡并切回打卡屏；清掉预填 */
  addCard: (input: NewCardInput) => Promise<void>
  /** 打开某卡的到期复盘屏 */
  openReview: (cardId: string) => void
  /** 续卡：用上一张卡的信息预填添加表单（购买日重置今天），切到添加屏 */
  startRenew: (card: Card) => void
  /** 切换底部 tab 视图 */
  setTab: (tab: ViewTab) => void
  /** 选卡：定位到某张卡并切回打卡屏（总览点卡用） */
  selectCard: (cardId: string) => void
}

/** 内存态也过滤软删除，避免组件看到墓碑记录 */
const alive = <T extends { deleted?: boolean }>(list: T[]) => list.filter((x) => !x.deleted)

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  checkins: [],
  loading: false,
  activeTab: 'checkin',
  activeCardId: null,
  reviewCardId: null,
  prefillCard: null,

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
    // 默认选中第一张卡（若之前已选且仍存在则保留）
    const prev = get().activeCardId
    const activeCardId = prev && cards.some((c) => c.id === prev) ? prev : (cards[0]?.id ?? null)
    set({ cards, checkins: checkinLists.flat(), loading: false, activeCardId })
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

  async addCard(input) {
    const card: Card = {
      ...input,
      id: genId('card'),
      updatedAt: Date.now(),
      _dirty: true,
    }
    console.log(`[worthit:store] 添加卡 cardId=${card.id} name=${card.name} type=${card.type}`)
    await storage.saveCard(card)
    // 入内存 + 新卡成为当前卡并切回打卡屏（对齐原型「保存，开始打卡」）；清掉续卡预填
    set({
      cards: [...get().cards, card],
      activeCardId: card.id,
      activeTab: 'checkin',
      prefillCard: null,
    })
  },

  openReview(cardId) {
    console.log(`[worthit:store] 打开复盘 cardId=${cardId}`)
    set({ reviewCardId: cardId, activeTab: 'review' })
  },

  startRenew(card) {
    // 用上期卡信息预填，购买日重置今天、有效期顺延一年（仅不限次年卡有意义，有限次也给个默认）
    const purchaseDate = getToday()
    const prefill: NewCardInput = {
      name: card.name,
      totalPrice: card.totalPrice,
      type: card.type,
      purchaseDate,
      expireDate: addYears(purchaseDate, 1),
      ...(card.totalTimes != null ? { totalTimes: card.totalTimes } : {}),
      ...(card.expectedPrice != null ? { expectedPrice: card.expectedPrice } : {}),
    }
    console.log(`[worthit:store] 续卡预填 name=${card.name} 切到添加屏`)
    set({ prefillCard: prefill, activeTab: 'add' })
  },

  setTab(tab) {
    set({ activeTab: tab })
  },

  selectCard(cardId) {
    console.log(`[worthit:store] 选卡 cardId=${cardId} 并切回打卡屏`)
    set({ activeCardId: cardId, activeTab: 'checkin' })
  },
}))
