import { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import {
  calcCard,
  getReviewVerdict,
  type Card,
  type CheckIn,
  type ReviewVerdict,
} from '@worthit/core'
import { Ticket, MonoCap, LineItem, DashRule, Button, Icon } from '@/components'
import { today } from '../../utils/date'
import { t } from '../../i18n'
import './ReviewScreen.scss'

/**
 * 到期复盘屏（移植自 design/mobile.html 屏6「结算总票」）。
 *
 * 自算 calc + verdict（与 CardSlide 同模式，派生数字不入库）。
 * verdict 枚举来自 core（getReviewVerdict），文案在此映射——core 不产文案。
 * 用本次真实数据给「结算总票」+「下次怎么选」建议，闭环到续卡（startRenew）。
 */
interface ReviewScreenProps {
  card: Card
  allCheckins: CheckIn[]
  onRenew: (card: Card) => void
  onExport: () => void
}

export function ReviewScreen({ card, allCheckins, onRenew, onExport }: ReviewScreenProps) {
  const { calc, verdict } = useMemo(() => {
    const checkins = allCheckins.filter((c) => !c.deleted && c.cardId === card.id)
    const calc = calcCard(card, checkins, today())
    const verdict = getReviewVerdict(calc, card.totalPrice, card.expectedPrice)
    return { calc, verdict }
  }, [card, allCheckins])

  const title =
    verdict === 'worthIt'
      ? t('review.titleWorth')
      : verdict === 'soso'
        ? t('review.titleSoso')
        : t('review.titleNotWorth')
  const advice =
    verdict === 'worthIt'
      ? t('review.adviceWorth')
      : verdict === 'soso'
        ? t('review.adviceSoso')
        : t('review.adviceNotWorth')

  // 省下/多花：savedVsExpected 为正显「省下」绿，为负显「多花」红
  const saved = calc.savedVsExpected
  const savedPositive = saved != null && saved >= 0

  return (
    <View className="review">
      {/* 结算总票 */}
      <Ticket toothed className="review__receipt">
        <View className="review__receipt-inner">
          <MonoCap>{t('review.finalReceipt')}</MonoCap>

          {/* 结论印章：大圆对勾 */}
          <View className={`review__seal review__seal--${verdict}`}>
            <Icon name="check" size={28} strokeWidth={2.6} color={sealColor(verdict)} />
          </View>

          <Text className="review__title">{title}</Text>
          <Text className="review__subtitle">
            {t('review.subtitle', { name: card.name, count: calc.checkInCount })}
          </Text>

          <DashRule />

          <LineItem
            label={t('review.finalUnit')}
            value={calc.realUnitCost != null ? `¥${calc.realUnitCost} ${t('review.perTime')}` : '—'}
            valueColor={verdict === 'worthIt' ? 'var(--c-save)' : 'var(--c-ink)'}
          />
          {card.expectedPrice != null && (
            <LineItem
              label={t('review.yourWorth')}
              value={`¥${card.expectedPrice} ${t('review.perTime')}`}
            />
          )}

          {/* 有限次卡到期未用浪费 */}
          {calc.wastedUnused > 0 && (
            <LineItem
              label={t('review.wastedUnused')}
              value={`¥${formatMoney(calc.wastedUnused)}`}
              valueColor="var(--c-burn)"
            />
          )}

          <DashRule />

          {/* 省下/多花强调行（有心里价才显示） */}
          {saved != null && (
            <LineItem
              label={savedPositive ? t('review.savedVs') : t('review.lostVs')}
              value={`¥${formatMoney(Math.abs(saved))}`}
              valueColor={savedPositive ? 'var(--c-save)' : 'var(--c-burn)'}
              emphasize
            />
          )}
        </View>
      </Ticket>

      {/* 下次怎么选（黄票） */}
      <View className="review__next">
        <View className="review__next-head">
          <Icon name="bulb" size={18} strokeWidth={2.4} color="var(--c-ink)" />
          <Text className="review__next-title">{t('review.nextTitle')}</Text>
        </View>
        <Text className="review__next-body">{advice}</Text>
      </View>

      <Button variant="ink" size="large" className="review__renew" onClick={() => onRenew(card)}>
        {t('review.renew')}
      </Button>
      <Text className="review__export" onClick={onExport}>
        {t('review.exportData')}
      </Text>
    </View>
  )
}

/** verdict → 印章描边/对勾色 */
function sealColor(verdict: ReviewVerdict): string {
  if (verdict === 'worthIt') return 'var(--c-save)'
  if (verdict === 'soso') return 'var(--c-alert-d)'
  return 'var(--c-mute)'
}

/** 金额千分位（手写，小程序 toLocaleString 不可靠） */
function formatMoney(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
