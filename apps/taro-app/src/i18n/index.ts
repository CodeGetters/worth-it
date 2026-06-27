/**
 * 极简 i18n：t(key, params) 按点路径取文案，{placeholder} 用 params 填充。
 *
 * 第一版只有 zh。结构上留好上移到 packages/i18n 的口子——将来出海加 locale，
 * 只需扩 LOCALES 与 currentLocale，调用方 t() 不变。
 */
import { zh } from './locales/zh'

type Params = Record<string, string | number>

const LOCALES = { zh }
type Locale = keyof typeof LOCALES

// 当前语言：第一版固定 zh，预留切换入口（将来读系统语言 / 用户设置）
let currentLocale: Locale = 'zh'

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

/** 按 'a.b.c' 路径从字典取字符串 */
function resolve(dict: unknown, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === 'object' && seg in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[seg]
    }
    return undefined
  }, dict)
  return typeof value === 'string' ? value : undefined
}

/**
 * 取文案。未命中时返回 key 本身（开发期一眼看出漏翻，不崩）。
 * @example t('checkin.countGone', { count: 8 }) → '已去 8 次'
 */
export function t(key: string, params?: Params): string {
  const raw = resolve(LOCALES[currentLocale], key)
  if (raw == null) {
    console.warn(`[worthit:i18n] 缺少文案 key=${key}`)
    return key
  }
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}
