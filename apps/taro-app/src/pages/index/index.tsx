import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { calcCard, getFeedback, detectTurningPoint, type CalcResult, type Card } from '@worthit/core'
import {
  AppBar,
  IconButton,
  TabBar,
  Dots,
  Ticket,
  PriceDisplay,
  Button,
  ProgressBar,
  MonoCap,
  Stamp,
  DashRule,
  LineItem,
  Icon,
  type PriceTone,
  type TicketTone,
  type TabKey,
} from '@/components'
import { useCardStore } from '../../store/useCardStore'
import { today } from '../../utils/date'
import { t } from '../../i18n'
import './index.scss'

/** 打卡后短暂展示的反馈（delta / 转折），下次打卡或切卡时刷新 */
interface Flash {
  diff: number
  turn: ReturnType<typeof detectTurningPoint>
}

/** 未建页面的占位提示（+ / 总览 / 我的 / 补打），不假装跳转 */
function comingSoon() {
  void Taro.showToast({ title: t('nav.comingSoon'), icon: 'none' })
}

export default function Index() {
  const { cards, checkins: allCheckins, load, checkIn, undoCheckIn } = useCardStore()
  const [flash, setFlash] = useState<Flash | null>(null)
  // 多卡左右滑：当前卡索引（第一版只渲染当前卡，指示器已就绪）
  const [activeIdx] = useState(0)
  const beforeRef = useRef<CalcResult | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  const card = cards[activeIdx]
  // 订阅原始 checkins 状态并实时过滤（软删除 + 本卡）：打卡/撤销后能触发重算
  const checkins = useMemo(
    () => (card ? allCheckins.filter((c) => !c.deleted && c.cardId === card.id) : []),
    [card, allCheckins],
  )

  // 派生数字实时算（单一真相）：今天作参数传入，core 不碰时间
  const calc = useMemo(() => (card ? calcCard(card, checkins, today()) : null), [card, checkins])
  const feedback = calc ? getFeedback(calc) : null

  async function handleCheckIn() {
    if (!card || !calc) return
    if (calc.full) return // 打满冻结，禁止再打
    beforeRef.current = calc
    await checkIn(card.id)
  }

  // 打卡后：用 before/after 算 delta 与转折（在 calc 更新后的副作用里比对）
  useEffect(() => {
    const before = beforeRef.current
    if (!before || !calc) return
    beforeRef.current = null
    const diff =
      before.realUnitCost != null && calc.realUnitCost != null
        ? before.realUnitCost - calc.realUnitCost
        : 0
    setFlash({ diff, turn: detectTurningPoint(before, calc) })
  }, [calc])

  async function handleUndo() {
    if (!card) return
    const last = checkins[checkins.length - 1]
    if (!last) return
    setFlash(null)
    await undoCheckIn(last.id)
  }

  function handleTab(key: TabKey) {
    if (key !== 'checkin') comingSoon()
  }

  return (
    <View className="checkin">
      <AppBar
        title={t('nav.myCards')}
        right={<IconButton name="plus" ariaLabel={t('nav.addCard')} onClick={comingSoon} />}
      />

      <View className="checkin__body">
        {card && calc && feedback ? (
          <>
            <Dots total={cards.length} activeIndex={activeIdx} className="checkin__dots" />
            <CardTicket
              card={card}
              calc={calc}
              feedback={feedback}
              flash={flash}
              onCheckIn={handleCheckIn}
              onUndo={handleUndo}
              onBackfill={comingSoon}
            />
          </>
        ) : (
          <View className="checkin__loading">
            <Text className="checkin__loading-text">{t('app.name')}</Text>
          </View>
        )}
      </View>

      <TabBar
        active="checkin"
        onChange={handleTab}
        labels={{
          checkin: t('nav.tabCheckin'),
          overview: t('nav.tabOverview'),
          me: t('nav.tabMe'),
        }}
      />
    </View>
  )
}

interface CardTicketProps {
  card: Card
  calc: CalcResult
  feedback: ReturnType<typeof getFeedback>
  flash: Flash | null
  onCheckIn: () => void
  onUndo: () => void
  onBackfill: () => void
}

/** 票面：卡名印章 + 大单价怼脸 + 状态文案 + 进度 + 打卡/撤销/补打 */
function CardTicket({ card, calc, feedback, flash, onCheckIn, onUndo, onBackfill }: CardTicketProps) {
  const worth = card.expectedPrice
  const broken = feedback.breakLevel !== 'none'
  const tone: TicketTone = broken ? 'burn' : calc.expired ? 'review' : 'normal'
  const priceTone: PriceTone = broken ? 'burn' : calc.belowExpected ? 'save' : 'normal'
  const typeLabel = card.type === 'unlimited' ? '不限次' : '有限次'

  return (
    <Ticket tone={tone} toothed className="checkin__ticket">
      {/* 头部：卡名印章 + 次数 */}
      <View className="ticket-head">
        <Stamp variant={broken ? 'burn' : 'alert'}>{`${card.name} · ${typeLabel}`}</Stamp>
        <MonoCap>{t('checkin.countGone', { count: calc.checkInCount })}</MonoCap>
      </View>

      <DashRule />

      {/* 大单价区：垂直居中怼脸 */}
      <View className="ticket-price">
        <MonoCap>{broken ? t('checkin.priceLabelBreak') : t('checkin.priceLabelNormal')}</MonoCap>

        {calc.enoughSample ? (
          <PriceDisplay value={calc.realUnitCost} tone={priceTone} unit={t('checkin.perTime')} />
        ) : (
          <FewSample toGo={calc.checkInsToSample} />
        )}

        {calc.enoughSample && (
          <DeltaHint calc={calc} feedback={feedback} flash={flash} worth={worth} broken={broken} />
        )}
      </View>

      {/* 心里价参照（仅有心里价且样本充分时显示） */}
      {calc.enoughSample && worth != null && calc.realUnitCost != null && (
        <View className="ticket-progress">
          <DashRule />
          <LineItem
            label={t('checkin.compareWorth', { worth })}
            value={
              calc.belowExpected
                ? t('checkin.togoBelow')
                : t('checkin.togoNeed', { n: calc.checkInsToExpected ?? 0 })
            }
            valueColor={calc.belowExpected ? 'var(--c-save)' : 'var(--c-warn)'}
            emphasize
          />
          <ProgressBar ratio={Math.min(1, worth / calc.realUnitCost)} done={calc.belowExpected} />
        </View>
      )}

      {/* 操作区：大打卡按钮 + 补打 / 撤销 */}
      <View className="ticket-actions">
        <Button
          variant="alert"
          size="large"
          disabled={calc.full}
          icon={!calc.full ? <Icon name="check" size={24} strokeWidth={2.8} color="var(--c-ink)" /> : undefined}
          onClick={onCheckIn}
        >
          {calc.full ? t('checkin.btnFull') : t('checkin.btnCheckIn')}
        </Button>
        {calc.checkInCount > 0 ? (
          <Text className="ticket-actions__link" onClick={onUndo}>
            {t('checkin.btnUndo')}
          </Text>
        ) : (
          <Text className="ticket-actions__link" onClick={onBackfill}>
            {t('checkin.backfill')}
          </Text>
        )}
      </View>
    </Ticket>
  )
}

/** 少样本占位：不显天价，给「再打 N 次」引导 */
function FewSample({ toGo }: { toGo: number }) {
  return (
    <View className="fewsample">
      <Text className="fewsample__ph">{t('checkin.fewSamplePlaceholder')}</Text>
      <Text className="fewsample__title">{t('checkin.fewSampleTitle', { n: toGo })}</Text>
      <Text className="fewsample__desc">{t('checkin.fewSampleDesc')}</Text>
    </View>
  )
}

/** delta（这次便宜多少 / 转折，印章呈现）+ hint（跟心里价比 / 断卡负反馈） */
function DeltaHint({
  calc,
  feedback,
  flash,
  worth,
  broken,
}: {
  calc: CalcResult
  feedback: ReturnType<typeof getFeedback>
  flash: Flash | null
  worth?: number
  broken: boolean
}) {
  const price = calc.realUnitCost ?? 0

  // 断卡负反馈：按档位映射文案
  if (broken) {
    const lvl = feedback.breakLevel
    const days = calc.breakDays ?? 0
    const text =
      lvl === 'mild'
        ? t('feedback.break.mild')
        : lvl === 'number'
          ? t('feedback.break.number', { price })
          : lvl === 'harsh'
            ? t('feedback.break.harsh', { days, wasted: calc.wastedByBreak })
            : t('feedback.break.stop')
    return <Text className="ticket-hint ticket-hint--burn">{text}</Text>
  }

  // delta：刚打卡的瞬时反馈（印章化）
  let delta: string | null = null
  if (flash) {
    if (flash.turn === 'fullPaid') delta = t('feedback.turn.fullPaid', { price })
    else if (flash.turn === 'becameGoodDeal') delta = t('feedback.turn.becameGoodDeal', { price })
    else if (flash.turn === 'bigDrop') delta = t('feedback.turn.bigDrop', { diff: flash.diff })
    else if (flash.diff > 0) delta = t('checkin.deltaCheaper', { diff: flash.diff })
  }

  // hint：跟心里价比
  let hint: string
  if (worth == null) hint = t('checkin.hintNoWorth')
  else if (calc.belowExpected) hint = t('checkin.hintBelow', { worth })
  else hint = t('checkin.hintAbove', { worth, over: price - worth })

  return (
    <View className="ticket-feedback">
      {delta && (
        <Stamp variant="save" icon={<Icon name="arrowDown" size={14} strokeWidth={2.8} color="var(--c-save)" />}>
          {delta}
        </Stamp>
      )}
      <Text className="ticket-hint">{hint}</Text>
    </View>
  )
}
