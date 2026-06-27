import { View, Text } from '@tarojs/components'
import type { CardStatus } from '@worthit/core'
import { Ticket } from './Ticket'
import { Stamp, type StampVariant } from './Stamp'
import { MonoCap } from './MonoCap'
import { Icon } from './Icon'
import './OverviewList.scss'

/**
 * 总览页主体（移植自 design/mobile.html 屏7）：顶部汇总票 + 卡列表。
 *
 * 纯展示组件：props 接页面层用 core 算好的数字，组件内不碰 store / core / 时间。
 * 色彩一律走 var(--c-*)，契合「清醒小票」与主题切换地基。
 */

/** 汇总数据（页面层遍历各卡 calcCard 后聚合） */
export interface OverviewSummary {
  /** 相对单次买总共省下的钱（Σ savedVsExpected）；正=省、负=亏、0=无心里价可算 */
  savedTotal: number
  /** 在用卡数（status=active） */
  activeCount: number
  /** 在亏卡数（status=burning） */
  burningCount: number
  /** 已结束卡数（status=review） */
  reviewCount: number
}

/** 列表单行数据（每张卡一行） */
export interface OverviewRow {
  cardId: string
  /** 「卡名 · 卡型」标题 */
  title: string
  /** 副行摘要（已去 N 次 · ¥X/次 等，页面层组装文案） */
  summary: string
  /** 整体状态，决定行边框色调与印章 */
  status: CardStatus
  /** 印章文案（越用越省 / 在用 / 在亏钱 / 待复盘） */
  stampText: string
}

interface OverviewListProps {
  summary: OverviewSummary
  rows: OverviewRow[]
  /** 汇总票主文案（省下 / 在亏 / 中性），由页面层按 savedTotal 正负选 */
  summaryLabel: string
  /** 汇总票标号大写帽 */
  summaryCap: string
  /** 列表区标题（我的卡 · N · 点任一张进去打卡） */
  listCap: string
  /** 三个计数的标签 */
  countLabels: { active: string; burning: string; review: string }
  /** 点某张卡：回打卡屏并定位 */
  onSelect: (cardId: string) => void
}

/** status → 印章色调 / 行 tone */
const STAMP_VARIANT: Record<CardStatus, StampVariant> = {
  active: 'save',
  burning: 'burn',
  review: 'default',
}

export function OverviewList({
  summary,
  rows,
  summaryLabel,
  summaryCap,
  listCap,
  countLabels,
  onSelect,
}: OverviewListProps) {
  const positive = summary.savedTotal > 0
  const negative = summary.savedTotal < 0
  // 主数字：省=绿+「+¥」、亏=红+「¥」、中性=不显金额
  const amountColor = positive ? 'var(--c-save)' : negative ? 'var(--c-burn)' : 'var(--c-faint)'
  const amountText = positive
    ? `+¥${formatMoney(summary.savedTotal)}`
    : negative
      ? `¥${formatMoney(Math.abs(summary.savedTotal))}`
      : '—'

  return (
    <View className="overview">
      {/* 汇总票：深色票，hero 大数字 */}
      <View className="overview__summary">
        <MonoCap className="overview__summary-cap">{summaryCap}</MonoCap>
        <View className="overview__amount-row">
          <Text className="overview__amount" style={{ color: amountColor }}>
            {amountText}
          </Text>
          <Text className="overview__amount-label">{summaryLabel}</Text>
        </View>
        <View className="overview__counts">
          <Counter value={summary.activeCount} label={countLabels.active} color="var(--c-on-ink)" />
          <Counter value={summary.burningCount} label={countLabels.burning} color="var(--c-burn)" />
          <Counter value={summary.reviewCount} label={countLabels.review} color="var(--c-on-ink)" />
        </View>
      </View>

      {/* 卡列表 */}
      <MonoCap className="overview__list-cap">{listCap}</MonoCap>
      <View className="overview__list">
        {rows.map((row) => (
          <Ticket
            key={row.cardId}
            tone={row.status === 'burning' ? 'burn' : row.status === 'review' ? 'review' : 'normal'}
            flat
            className="overview__row"
          >
            <View className="overview__row-inner" onClick={() => onSelect(row.cardId)}>
              <View className="overview__row-main">
                <Text className="overview__row-title">{row.title}</Text>
                <Text className="overview__row-summary">{row.summary}</Text>
              </View>
              <Stamp variant={STAMP_VARIANT[row.status]}>{row.stampText}</Stamp>
              <Icon name="chevronRight" size={16} strokeWidth={2.4} color="var(--c-mute)" />
            </View>
          </Ticket>
        ))}
      </View>
    </View>
  )
}

/** 汇总票里的单个计数（大数字 + 大写帽标签） */
function Counter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="overview__counter">
      <Text className="overview__counter-num" style={{ color }}>
        {value}
      </Text>
      <MonoCap className="overview__counter-label">{label}</MonoCap>
    </View>
  )
}

/** 金额千分位（不带货币符，符号由调用方拼）。整数展示，与单价口径一致。
 *  手写分组而非 toLocaleString：小程序 JS 引擎对 locale 参数支持不可靠 */
function formatMoney(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
