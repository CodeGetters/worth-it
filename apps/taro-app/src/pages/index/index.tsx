import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Swiper, SwiperItem } from '@tarojs/components'
import type { BaseEventOrig } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { calcCard, detectTurningPoint, type CalcResult } from '@worthit/core'
import { AppBar, IconButton, TabBar, Dots, Toast, ConfirmDialog, Skeleton, EmptyState, type TabKey } from '@/components'
import { useCardStore } from '../../store/useCardStore'
import { AddCardForm } from './AddCardForm'
import { ReviewScreen } from './ReviewScreen'
import { CardSlide } from './CheckinScreen'
import { OverviewView } from './OverviewScreen'
import { comingSoon, type Flash } from './shared'
import { today } from '../../utils/date'
import { t } from '../../i18n'
import './index.scss'

/** 里程碑 Toast 内容（大字 + 小字） */
interface ToastMsg {
  big: string
  small?: string
}

/**
 * 转折枚举 → 里程碑 Toast 文案。返回 null 表示这次打卡无里程碑（不弹 Toast）。
 * 对齐原型 doCheckIn：回归 / 划算了 / 单价大跌 / 打满 才弹。
 */
function turnToToast(turn: ReturnType<typeof detectTurningPoint>, price: number, diff: number): ToastMsg | null {
  switch (turn) {
    case 'welcomeBack':
      return { big: t('feedback.toast.welcomeBackBig'), small: t('feedback.toast.welcomeBackSmall') }
    case 'becameGoodDeal':
      return { big: t('feedback.toast.goodDealBig'), small: t('feedback.toast.goodDealSmall', { price }) }
    case 'fullPaid':
      return { big: t('feedback.toast.fullPaidBig'), small: t('feedback.toast.fullPaidSmall', { price }) }
    case 'bigDrop':
      return { big: t('feedback.toast.bigDropBig', { diff }), small: t('feedback.toast.bigDropSmall') }
    default:
      return null
  }
}

export default function Index() {
  const {
    cards,
    checkins: allCheckins,
    activeTab,
    activeCardId,
    reviewCardId,
    reviewFrom,
    prefillCard,
    loading,
    load,
    checkIn,
    undoCheckIn,
    addCard,
    openReview,
    startRenew,
    openAddForm,
    setTab,
    selectCard,
  } = useCardStore()
  const [flash, setFlash] = useState<Flash | null>(null)
  const [toast, setToast] = useState<ToastMsg | null>(null)
  // 撤销确认弹窗：避免误触撤掉刚打的卡
  const [confirmUndo, setConfirmUndo] = useState(false)
  const beforeRef = useRef<CalcResult | null>(null)
  // 打卡进行中标记：await 落库期间拒绝重入，防误触连点导致同一下多次写入
  const checkingRef = useRef(false)

  useEffect(() => {
    void load()
  }, [load])

  // 当前卡：按 activeCardId 定位（兜底第一张），替代此前写死的 activeIdx=0
  const activeIdx = useMemo(() => {
    const i = cards.findIndex((c) => c.id === activeCardId)
    return i >= 0 ? i : 0
  }, [cards, activeCardId])
  const card = cards[activeIdx]
  // 订阅原始 checkins 状态并实时过滤（软删除 + 本卡）：打卡/撤销后能触发重算
  const checkins = useMemo(
    () => (card ? allCheckins.filter((c) => !c.deleted && c.cardId === card.id) : []),
    [card, allCheckins],
  )

  // 派生数字实时算（单一真相）：今天作参数传入，core 不碰时间。
  // 这里只算「当前卡」给打卡/撤销/转折比对用；各 SwiperItem 的票面由 CardSlide 各自算。
  const calc = useMemo(() => (card ? calcCard(card, checkins, today()) : null), [card, checkins])

  async function handleCheckIn() {
    if (!card || !calc) return
    if (calc.full || calc.expired) return // 打满 / 过期冻结，禁止再打
    if (checkingRef.current) return // 防误触连点：上一次打卡落库未完成时忽略
    checkingRef.current = true
    beforeRef.current = calc
    // 打卡瞬间轻震动（盖章手感，对齐原型 navigator.vibrate）；H5/不支持端静默
    try {
      void Taro.vibrateShort({ type: 'light' })
    } catch {
      // 部分端不支持，忽略
    }
    try {
      await checkIn(card.id)
    } finally {
      checkingRef.current = false
    }
  }

  // 打卡后：用 before/after 算 delta 与转折（在 calc 更新后的副作用里比对）
  useEffect(() => {
    const before = beforeRef.current
    if (!before || !calc) return
    beforeRef.current = null
    // 少样本期票面藏单价（显「再打 N 次」），此时不弹任何单价相关反馈，避免口径自相矛盾
    if (!calc.enoughSample) {
      setFlash(null)
      setToast(null)
      return
    }
    const diff =
      before.realUnitCost != null && calc.realUnitCost != null
        ? before.realUnitCost - calc.realUnitCost
        : 0
    const turn = detectTurningPoint(before, calc)
    setFlash({ diff, turn })
    // 里程碑走 Toast 抢镜（回归 / 划算 / 大跌 / 打满）；常规小幅下降只在票面显 delta
    setToast(turnToToast(turn, calc.realUnitCost ?? 0, diff))
  }, [calc])

  // 清掉打卡瞬时反馈（票面 delta + 里程碑 Toast），切卡/切屏/撤销/补打时用
  function clearFlash() {
    setFlash(null)
    setToast(null)
  }

  // 撤销分两步：点「撤销上一次」先弹确认，确认后才真正删（防误触撤掉刚打的卡）
  function handleUndo() {
    if (!card) return
    if (!checkins[checkins.length - 1]) return
    setConfirmUndo(true)
  }

  async function doUndo() {
    setConfirmUndo(false)
    if (!card) return
    const last = checkins[checkins.length - 1]
    if (!last) return
    clearFlash()
    await undoCheckIn(last.id)
  }

  // 补打过去的卡：Picker 已把范围限在购买日~今天，core 再兜一层越界过滤。
  // 补打是过去的日期，不设 beforeRef → 不触发「这次便宜」即时反馈（那是「今天去了」的爽感）。
  async function handleBackfill(date: string) {
    if (!card) return
    clearFlash()
    await checkIn(card.id, date)
  }

  // Swiper 切卡：同步选中卡 + 清掉上一张的瞬时反馈，避免 delta 串卡
  function handleSwiperChange(e: BaseEventOrig<{ current: number }>) {
    const idx = e.detail.current
    const next = cards[idx]
    if (next && next.id !== activeCardId) {
      clearFlash()
      selectCard(next.id)
    }
  }

  function handleTab(key: TabKey) {
    if (key === 'checkin' || key === 'overview') {
      clearFlash() // 切视图清掉打卡瞬时反馈，避免回到打卡屏残留旧 flash
      setTab(key)
    } else {
      comingSoon()
    }
  }

  // 总览点卡：待复盘（已过期）卡进复盘屏，其余切回打卡屏定位
  function handleOverviewSelect(cardId: string) {
    const c = cards.find((x) => x.id === cardId)
    if (c && calcCard(c, [], today()).expired) {
      openReview(cardId)
    } else {
      selectCard(cardId)
    }
  }

  const isOverview = activeTab === 'overview'
  const isAdd = activeTab === 'add'
  const isReview = activeTab === 'review'
  const reviewCard = isReview ? cards.find((c) => c.id === reviewCardId) : undefined

  // 防御：在复盘屏但目标卡已不存在（被删/数据异常）→ 自动退回来源，避免串屏到打卡 Swiper
  useEffect(() => {
    if (isReview && !reviewCard) setTab(reviewFrom)
  }, [isReview, reviewCard, reviewFrom, setTab])

  return (
    <View className="checkin">
      {isAdd ? (
        <AppBar title={t('addCard.title')} showBack onBack={() => setTab('checkin')} />
      ) : isReview ? (
        <AppBar title={t('review.title')} showBack onBack={() => setTab(reviewFrom)} />
      ) : (
        <AppBar
          title={isOverview ? t('nav.tabOverview') : t('nav.myCards')}
          right={
            <IconButton name="plus" ariaLabel={t('nav.addCard')} onClick={openAddForm} />
          }
        />
      )}

      <View className="checkin__body checkin__body--fade" key={activeTab}>
        {isAdd ? (
          <AddCardForm onSubmit={addCard} prefill={prefillCard} />
        ) : isReview ? (
          // reviewCard 缺失时渲染空（上面的 effect 会自动退回来源），不落入打卡 Swiper 串屏
          reviewCard ? (
            <ReviewScreen
              card={reviewCard}
              allCheckins={allCheckins}
              onRenew={startRenew}
              onExport={comingSoon}
            />
          ) : null
        ) : isOverview ? (
          <OverviewView cards={cards} allCheckins={allCheckins} onSelect={handleOverviewSelect} />
        ) : cards.length > 0 ? (
          <>
            <Dots total={cards.length} activeIndex={activeIdx} className="checkin__dots" />
            <Swiper
              className="checkin__swiper"
              current={activeIdx}
              onChange={handleSwiperChange}
              circular={false}
            >
              {cards.map((c) => (
                <SwiperItem key={c.id} className="checkin__swiper-item">
                  {/* 仅当前卡参与打卡/反馈交互；非当前卡也算 calc（卡数量级小，简单可靠、无切卡闪烁）。
                      key=c.id 让换卡时 PriceDisplay 重挂载，初始即终值不滚动——切卡不该误触「单价掉了」动画 */}
                  <CardSlide
                    card={c}
                    allCheckins={allCheckins}
                    isActive={c.id === card?.id}
                    flash={c.id === card?.id ? flash : null}
                    onCheckIn={handleCheckIn}
                    onUndo={handleUndo}
                    onBackfill={handleBackfill}
                    onReview={() => openReview(c.id)}
                  />
                </SwiperItem>
              ))}
            </Swiper>
          </>
        ) : loading ? (
          <Skeleton />
        ) : (
          <EmptyState
            title={t('checkin.emptyTitle')}
            hint={t('checkin.emptyHint')}
            actionText={t('checkin.emptyAction')}
            onAction={openAddForm}
          />
        )}
      </View>

      <TabBar
        active={isReview ? (reviewFrom as TabKey) : isAdd ? 'checkin' : activeTab}
        onChange={handleTab}
        labels={{
          checkin: t('nav.tabCheckin'),
          overview: t('nav.tabOverview'),
          me: t('nav.tabMe'),
        }}
      />

      {/* 里程碑 Toast：仅打卡屏弹（盖章式抢镜，1.8s 自隐） */}
      {!isAdd && !isReview && !isOverview && (
        <Toast
          show={toast != null}
          big={toast?.big ?? ''}
          small={toast?.small}
          onHide={() => setToast(null)}
        />
      )}

      {/* 撤销打卡确认：误触保护，撤销是把刚打的记录删掉 */}
      <ConfirmDialog
        show={confirmUndo}
        title={t('checkin.undoConfirmTitle')}
        message={t('checkin.undoConfirmMsg')}
        confirmText={t('checkin.undoConfirmOk')}
        cancelText={t('common.cancel')}
        onConfirm={doUndo}
        onCancel={() => setConfirmUndo(false)}
      />
    </View>
  )
}
