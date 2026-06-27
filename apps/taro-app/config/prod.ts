import type { UserConfigExport } from '@tarojs/cli'

export default {
  mini: {},
  h5: {
    /**
     * 生产环境如需开启 cdn、压缩、分析等，可在此配置：
     * webpackChain (config) { config.plugin('analyzer')... }
     */
  },
} satisfies UserConfigExport<'vite'>
