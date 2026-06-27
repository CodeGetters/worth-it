/**
 * 轻量 id 生成：时间戳 + 随机后缀，四端通用。
 * 不依赖 crypto.randomUUID（小程序逻辑层不保证有）。本地数据量级下碰撞概率可忽略。
 */
export function genId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}_${rand}`
}
