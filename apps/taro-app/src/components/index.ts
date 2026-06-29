/**
 * 「清醒小票」组件库统一出口。
 *
 * 从已验证的设计稿（design/mobile.html + design/tokens.css）抽取的四端通用组件——
 * 纯展示图元（Stamp/Tear/DashRule/MonoCap/LineItem）+ 交互容器（Button/ProgressBar/
 * Dots/PriceDisplay/Ticket）。色彩一律走 var(--c-*)，为主题切换留地基；
 * 跨端用 @tarojs/components，不碰具体平台 API。
 *
 * 用法：import { Ticket, PriceDisplay, Button } from '@/components'
 */

// —— 底层小票图元（纯展示）——
export { Stamp, type StampVariant } from './Stamp'
export { Tear } from './Tear'
export { DashRule } from './DashRule'
export { MonoCap } from './MonoCap'
export { LineItem } from './LineItem'
export { Field, type FieldType } from './Field'

// —— 交互与容器 ——
export { Button, type ButtonVariant, type ButtonSize } from './Button'
export { ProgressBar } from './ProgressBar'
export { Dots } from './Dots'
export { PriceDisplay, type PriceTone } from './PriceDisplay'
export { Ticket, type TicketTone } from './Ticket'

// —— 图标 / 导航框架 ——
export { Icon } from './Icon'
export { AppBar, IconButton } from './AppBar'
export { TabBar, type TabKey } from './TabBar'
export { Toast } from './Toast'
export { ConfirmDialog } from './ConfirmDialog'
export { Skeleton } from './Skeleton'
export { EmptyState } from './EmptyState'

// —— 总览页主体 ——
export {
  OverviewList,
  type OverviewSummary,
  type OverviewRow,
} from './OverviewList'
