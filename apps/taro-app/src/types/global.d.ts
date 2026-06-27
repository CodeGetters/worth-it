/// <reference types="@tarojs/taro" />

declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.css'
declare module '*.less'
declare module '*.scss'
declare module '*.sass'
declare module '*.styl'

declare namespace NodeJS {
  interface ProcessEnv {
    /** NODE_ENV */
    NODE_ENV: 'development' | 'production'
    /** 当前编译的平台：weapp / h5 等 */
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'qq' | 'jd'
    /** 框架自带的环境变量前缀 */
    TARO_APP_ID: string
  }
}
