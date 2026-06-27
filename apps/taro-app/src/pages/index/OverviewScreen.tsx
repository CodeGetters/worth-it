import { useMemo } from 'react'
import {
  calcCard,
  getFeedback,
  type CalcResult,
  type Card,
  type CheckIn,
} from '@worthit/core'
import { OverviewList, type OverviewSummary, type OverviewRow } from '@/components'
import { today } from '../../utils/date'
import { t } from '../../i18n'
import { stampText } from './shared'

/**
 * 总览视图（移植自 design/mobile.html 屏7）。
 *
 * 遍历各卡实时调 core 算每行摘要 + 汇总（派生数字不入库），
 * 把算好的纯数据交给展示组件 OverviewList。
 */
export function OverviewView({
  cards,
  allCheckins,
  onSelect,
}: {
  cards: Card[]
  allCheckins: CheckIn[]
  onSelect: (cardId: string) => void
}) {
  const { summary, rows, hasPendingWorth } = useMemo(() => {
    const td = today()
    const summary: OverviewSummary = {
      savedTotal: 0,
      activeCount: 0,
      burningCount: 0,
      reviewCount: 0,
    }
    // 是否存在「填了心里价、但样本还不够（暂未计入汇总）」的卡——用于区分汇总为 0 的两种成因
    let hasPendingWorth = false
    const rows: OverviewRow[] = cards.map((card) => {
      const cis = allCheckins.filter((c) => !c.deleted && c.cardId === card.id)
      const calc = calcCard(card, cis, td)
      const { status } = getFeedback(calc)

      // 汇总：只累加「样本充分且填了心里价」的卡，与行内少样本隐藏单价口径一致
      // （少样本期 savedVsExpected 数字会乱跳，刚办卡不该被汇总成巨额盈亏）
      if (calc.enoughSample) summary.savedTotal += calc.savedVsExpected ?? 0
      else if (card.expectedPrice != null) hasPendingWorth = true
      if (status === 'active') summary.activeCount += 1
      else if (status === 'burning') summary.burningCount += 1
      else summary.reviewCount += 1

      return {
        cardId: card.id,
        title: `${card.name} · ${card.type === 'unlimited' ? '不限次' : '有限次'}`,
        summary: rowSummary(card, calc),
        status,
        stampText: stampText(status),
      }
    })
    return { summary, rows, hasPendingWorth }
  }, [cards, allCheckins])

  const summaryLabel =
    summary.savedTotal > 0
      ? t('overview.savedTotal')
      : summary.savedTotal < 0
        ? t('overview.lostTotal')
        : hasPendingWorth
          ? t('overview.pendingTotal')
          : t('overview.evenTotal')

  return (
    <OverviewList
      summary={summary}
      rows={rows}
      summaryLabel={summaryLabel}
      summaryCap={t('overview.summaryCap')}
      listCap={t('overview.listCap', { count: cards.length })}
      countLabels={{
        active: t('overview.countActive'),
        burning: t('overview.countBurning'),
        review: t('overview.countReview'),
      }}
      onSelect={onSelect}
    />
  )
}

/** 单行副摘要文案：按少样本 / 有限次 / 不限次分别组装（口径与打卡屏一致） */
function rowSummary(card: Card, calc: CalcResult): string {
  if (calc.checkInCount === 0) return t('overview.rowNoCheckIn')
  if (!calc.enoughSample) return t('overview.rowFewSample', { count: calc.checkInCount })
  const price = calc.realUnitCost ?? 0
  if (card.type === 'limited' && card.totalTimes) {
    return t('overview.rowLimited', {
      used: calc.checkInCount,
      total: card.totalTimes,
      price,
      unit: t('overview.unitClass'),
    })
  }
  return t('overview.rowUnit', { count: calc.checkInCount, price })
}
