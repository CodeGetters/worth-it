/**
 * 底层键值驱动抽象。
 *
 * 不同端的原生存储 API 不同（H5 localStorage 同步、小程序 Taro.setStorage 异步），
 * 这里统一抽象成异步 KV，由各端注入具体实现：
 * - H5/Web/测试：默认 webKVDriver（基于 localStorage / 内存兜底）
 * - 小程序：app 侧注入基于 Taro.getStorage/setStorage 的驱动
 *
 * LocalStorage（见 local.ts）只依赖本抽象，不直接碰任何端的原生 API。
 */
export interface KVDriver {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

/** 内存兜底驱动：无 localStorage 的环境（如 SSR、单测）使用 */
function createMemoryDriver(): KVDriver {
  const store = new Map<string, string>()
  return {
    get: (key) => Promise.resolve(store.has(key) ? store.get(key)! : null),
    set: (key, value) => {
      store.set(key, value)
      return Promise.resolve()
    },
    remove: (key) => {
      store.delete(key)
      return Promise.resolve()
    },
  }
}

/**
 * 默认 Web 驱动：基于 localStorage，包成 Promise。
 * 若运行环境无 localStorage（如小程序、Node 测试），自动降级到内存驱动。
 */
export function webKVDriver(): KVDriver {
  const hasLocalStorage = typeof globalThis !== 'undefined' && 'localStorage' in globalThis

  if (!hasLocalStorage) {
    return createMemoryDriver()
  }

  const ls = (globalThis as { localStorage: Storage }).localStorage
  return {
    get: (key) => Promise.resolve(ls.getItem(key)),
    set: (key, value) => {
      ls.setItem(key, value)
      return Promise.resolve()
    },
    remove: (key) => {
      ls.removeItem(key)
      return Promise.resolve()
    },
  }
}
