import Taro from '@tarojs/taro'
import { LocalStorage, type KVDriver } from '@worthit/storage'

/**
 * 基于 Taro Storage API 的 KV 驱动。
 *
 * Taro.getStorage/setStorage 跨端统一兜住小程序与 H5：
 * 小程序走原生 wx.setStorage，H5 走 localStorage。storage 包本身零框架依赖，
 * 由 app 侧在此注入 Taro 实现。
 */
function taroKVDriver(): KVDriver {
  return {
    async get(key) {
      try {
        const res = await Taro.getStorage({ key })
        return (res.data as string) ?? null
      } catch {
        // key 不存在时 Taro.getStorage 会 reject，按 null 处理
        return null
      }
    },
    async set(key, value) {
      await Taro.setStorage({ key, data: value })
    },
    async remove(key) {
      await Taro.removeStorage({ key })
    },
  }
}

/** 全局存储实例：业务层只依赖此 IStorage，切云时只换实现 */
export const storage = new LocalStorage(taroKVDriver())
