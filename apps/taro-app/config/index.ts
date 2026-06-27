import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import * as path from 'node:path'
import devConfig from './dev'
import prodConfig from './prod'

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<'vite'>(async (merge) => {
  const baseConfig: UserConfigExport<'vite'> = {
    projectName: 'worthit',
    date: '2026-6-26',
    // 设计稿基准宽（design/tokens.css 按 ~390 逻辑 px 画，token 全是真实 CSS px）。
    // 取 375（Taro 一等公民 + deviceRatio 已配 375:2），1px→2rpx，375 屏上还原 1:1 逻辑 px，
    // 与设计稿固定 px 对齐。⚠️ 不可设 750：那会把逻辑 px 当 750rpx 设计稿，1px→1rpx，
    // 真机 rpx 减半 → 全局等比缩小 50%（曾因此整页偏小）。
    designWidth: 375,
    // 路径别名：与 tsconfig paths "@/*" 对齐，让构建期也能解析 @/components 等
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: `dist/${process.env.TARO_ENV}`,
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'react',
    compiler: {
      type: 'vite',
    },
    cache: {
      enable: false,
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
