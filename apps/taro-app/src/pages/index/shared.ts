import { type detectTurningPoint, type getFeedback } from '@worthit/core'
import Taro from '@tarojs/taro'
import { t } from '../../i18n'

/**
 * 首页各视图屏（打卡 / 总览）共用的小工具与类型。
 *
 * 这里只放跨屏复用的纯展示辅助；与 store 状态、副作用相关的逻辑留在壳 index.tsx。
 */

/** 打卡后短暂展示的反馈（delta / 转折），下次打卡或切卡时刷新 */
export interface Flash {
  diff: number
  turn: ReturnType<typeof detectTurningPoint>
}

/** 未建页面的占位提示（+ / 总览 / 我的 / 补打），不假装跳转 */
export function comingSoon() {
  void Taro.showToast({ title: t('nav.comingSoon'), icon: 'none' })
}

/** status → 总览行印章文案 */
export function stampText(status: ReturnType<typeof getFeedback>['status']): string {
  if (status === 'burning') return t('overview.stampBurn')
  if (status === 'review') return t('overview.stampReview')
  return t('overview.stampSave')
}

