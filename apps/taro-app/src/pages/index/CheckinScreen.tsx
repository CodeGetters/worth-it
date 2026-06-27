import { useMemo } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import {
  calcCard,
  getFeedback,
  type CalcResult,
  type Card,
  type CheckIn,
} from '@worthit/core'
import {
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
} from '@/components'
import { today } from '../../utils/date'
import { t } from '../../i18n'
import type { Flash } from './shared'

/**
 * 打卡灵魂屏（移植自 design/mobile.html 屏2）。
 *
 * 单张卡一页（Swiper item），自算 calc/feedback（每张卡独立），渲染票面。
 * 把「算派生数字」下放到每个 SwiperItem，使多卡各自正确，不依赖父层只算当前卡。
 */
export function CardSlide({
  card,
  allCheckins,
  isActive,
  flash,
  onCheckIn,
  onUndo,
  onBackfill,
  onReview,
}: {
  card: Card
  allCheckins: CheckIn[]
  isActive: boolean
  flash: Flash | null
  onCheckIn: () => void
  onUndo: () => void
  onBackfill: (date: string) => void
  onReview: () => void
}) {
  const checkins = useMemo(
    () => allCheckins.filter((c) => !c.deleted && c.cardId === card.id),
    [allCheckins, card.id],
  )
  const calc = useMemo(() => calcCard(card, checkins, today()), [card, checkins])
  const feedback = getFeedback(calc)

  return (
    <CardTicket
      card={card}
      calc={calc}
      feedback={feedback}
      flash={isActive ? flash : null}
      onCheckIn={onCheckIn}
      onUndo={onUndo}
      onBackfill={onBackfill}
      onReview={onReview}
    />
  )
}

interface CardTicketProps {
  card: Card
  calc: CalcResult
  feedback: ReturnType<typeof getFeedback>
  flash: Flash | null
  onCheckIn: () => void
  onUndo: () => void
  onBackfill: (date: string) => void
  onReview: () => void
}

/** 票面：卡名印章 + 大单价怼脸 + 状态文案 + 进度 + 打卡/撤销/补打 */
function CardTicket({
  card,
  calc,
  feedback,
  flash,
  onCheckIn,
  onUndo,
  onBackfill,
  onReview,
}: CardTicketProps) {
  const worth = card.expectedPrice
  // 过期优先于断卡：卡都到期了，不再显示「快回来打卡」的断卡负反馈，只显过期复盘态
  const broken = feedback.breakLevel !== 'none' && !calc.expired
  const tone: TicketTone = broken ? 'burn' : calc.expired ? 'review' : 'normal'
  const priceTone: PriceTone = broken ? 'burn' : calc.belowExpected ? 'save' : 'normal'
  const typeLabel = card.type === 'unlimited' ? '不限次' : '有限次'
  // 价格区标签：断卡 > 过期 > 正常
  const priceLabel = broken
    ? t('checkin.priceLabelBreak')
    : calc.expired
      ? t('checkin.priceLabelExpired')
      : t('checkin.priceLabelNormal')
  // 主按钮：打满 → 禁用「已用完」；过期 → 可点「看复盘」走 onReview；正常 → 打卡
  const btnLabel = calc.full
    ? t('checkin.btnFull')
    : calc.expired
      ? t('checkin.btnExpired')
      : t('checkin.btnCheckIn')
  const btnDisabled = calc.full // 仅打满真禁用；过期按钮可点（进复盘）
  const onPrimary = calc.expired && !calc.full ? onReview : onCheckIn
  const showCheckIcon = !calc.full && !calc.expired

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
        <MonoCap>{priceLabel}</MonoCap>

        {/* 过期卡单价已冻结：即便样本少也显最终单价（不再引导「再打 N 次」，因为不能再打）。
            仅样本充足或已过期时显单价；其余少样本期显「再打 N 次」引导 */}
        {calc.enoughSample || calc.expired ? (
          <PriceDisplay value={calc.realUnitCost} tone={priceTone} unit={t('checkin.perTime')} />
        ) : (
          <FewSample toGo={calc.checkInsToSample} count={calc.checkInCount} />
        )}

        {(calc.enoughSample || calc.expired) && (
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
              calc.expired
                ? calc.belowExpected
                  ? t('checkin.togoExpiredBelow')
                  : t('checkin.togoExpiredAbove')
                : calc.belowExpected
                  ? t('checkin.togoBelow')
                  : t('checkin.togoNeed', { n: calc.checkInsToExpected ?? 0 })
            }
            valueColor={calc.belowExpected ? 'var(--c-save)' : 'var(--c-warn)'}
            emphasize
          />
          <ProgressBar ratio={Math.min(1, worth / calc.realUnitCost)} done={calc.belowExpected} />
        </View>
      )}

      {/* 操作区：大打卡按钮 + 撤销（有打卡时）+ 补打（常驻） */}
      <View className="ticket-actions">
        <Button
          variant="alert"
          size="large"
          disabled={btnDisabled}
          icon={showCheckIcon ? <Icon name="check" size={24} strokeWidth={2.8} color="var(--c-ink)" /> : undefined}
          onClick={onPrimary}
        >
          {btnLabel}
        </Button>
        <View className="ticket-actions__links">
          {calc.checkInCount > 0 && (
            <Text className="ticket-actions__link" onClick={onUndo}>
              {t('checkin.btnUndo')}
            </Text>
          )}
          <Picker
            mode="date"
            value={today()}
            start={card.purchaseDate}
            end={today()}
            onChange={(e) => onBackfill(String(e.detail.value))}
          >
            <Text className="ticket-actions__link">{t('checkin.backfill')}</Text>
          </Picker>
        </View>
      </View>
    </Ticket>
  )
}

/** 少样本占位：不显天价，给「再打 N 次」引导。完全没打过卡时多给一句行动引导 */
function FewSample({ toGo, count }: { toGo: number; count: number }) {
  return (
    <View className="fewsample">
      <Text className="fewsample__ph">{t('checkin.fewSamplePlaceholder')}</Text>
      <Text className="fewsample__title">{t('checkin.fewSampleTitle', { n: toGo })}</Text>
      <Text className="fewsample__desc">
        {count === 0 ? t('checkin.deltaTryFirst') : t('checkin.fewSampleDesc')}
      </Text>
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

  // delta：常规小幅下降的瞬时印章（「这次便宜 ¥X」）。
  // 里程碑（回归/划算/大跌/打满）已改走全屏 Toast 抢镜，这里不再重复显印章。
  let delta: string | null = null
  if (flash && flash.turn === 'none' && flash.diff > 0) {
    delta = t('checkin.deltaCheaper', { diff: flash.diff })
  }

  // hint：跟心里价比。过期态给「结论」，不再引导「继续去」
  let hint: string
  if (calc.expired) {
    if (worth == null) hint = t('checkin.hintExpiredNoWorth')
    else if (calc.belowExpected) hint = t('checkin.hintExpiredBelow', { worth })
    else hint = t('checkin.hintExpiredAbove', { worth, over: price - worth })
  } else if (worth == null) {
    hint = t('checkin.hintNoWorth')
  } else if (calc.belowExpected) {
    hint = t('checkin.hintBelow', { worth })
  } else {
    hint = t('checkin.hintAbove', { worth, over: price - worth })
  }

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
