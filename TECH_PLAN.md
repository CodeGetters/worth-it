# 值啦 · 技术方案

> 本文档记录技术选型与架构决策,供后续落地对照。
> 配套文件:`README.md`(产品方案)、`TODO.md`(决策与待办)、`prototype/`(交互原型)。

## 一、目标与约束

- **四端上线**:微信小程序、H5、Web、APP
- **一套代码尽量多端复用**,但不为复用牺牲小程序(主战场)体验
- **尽量用第三方库**让逻辑简单(注意:此诉求在小程序上受限,见动效章节)
- **个人独立项目**,追求最快验证、最低成本,与公司(转转)后端体系无关
- **核心原则:先验证、再投入**。后端、炫特效、3D、分享、多端账号全部按需拉动

## 二、四端归类

四端实为三类,真正要解决的是"小程序与网页共用一套代码,APP 用什么方式套出来":

```
小程序(微信)   → 主战场、传播入口,独立技术体系
H5 + Web        → 本质同源,一套搞定
APP(iOS/安卓) → 跨端框架直接打包即可,验证期不投原生
```

## 三、整体架构(四端不返工的地基)

核心思想:**计算逻辑与界面彻底分离**。不管用什么框架、上哪个端,核心算法是同一份 TS。

```
┌──────────────────────────────────┐
│  packages/core/   纯 TS,仅依赖 dayjs,零框架            │  ← 四端共享,永不改
│  ├─ calc.ts      calcCard / 频率 / 回本 / 预测        │     已在原型验证
│  ├─ feedback.ts  状态分级 / 负反馈三档 / 转折判定      │
│  └─ types.ts     Card / CheckIn / CalcResult         │
├──────────────────────────────────┤
│  apps/ (Taro + React + TS)                           │  ← 一套代码编译双端
│  ├─ 页面 / 组件 (.tsx)                                │
│  └─ 状态管理 (Zustand)                                │
├──────────────────────────────────┤
│  packages/storage/   统一接口 IStorage                │  ← 现在用本地
│  ├─ local.ts   小程序 Storage / web localStorage      │     将来加 cloud.ts
│  └─ cloud.ts   (预留)登录 + 云同步                   │
└──────────────────────────────────┘
```

<!--APPEND-->

## 四、前端选型

| 项 | 选型 | 理由 |
|---|------|------|
| 跨端框架 | **Taro** | 用户为 React 体系;Taro 用 React 语法,小程序+H5 都是一等公民 |
| 语言 | **TypeScript** | 跨端 + 将来接云,类型安全省大量低级 bug |
| 状态管理 | **Zustand** | Redux 过度设计,Context 有性能问题;Zustand 轻、易挂持久化 |
| 工程结构 | **monorepo** | core 要被多端共享 |

### 状态管理原则

- store 只存**原始数据**(`cards`),所有派生数字(单价/回本/负反馈)渲染时调 core 现算
- 单一真相,避免"存了旧单价忘更新"的 bug(延续原型"单次成本不存、实时算"原则)

### 工程结构

```
true-cost-calculator/
├─ packages/
│  ├─ core/         纯逻辑(从原型 app.js 抽取翻 TS)
│  └─ storage/      存储适配
├─ apps/
│  └─ taro-app/     Taro 主工程,编译小程序 + H5
├─ prototype/       现有 index.html,留作交互参考
├─ README.md / TODO.md / TECH_PLAN.md
```

### Taro 跨端已知坑

1. 样式单位:`px` 自动换 `rpx`,H5 表现需单独测(尤其"大数字怼脸")
2. 动效:小程序动画 API 与 H5 CSS 动画不同,核心动效可能要 `process.env.TARO_ENV` 分端
3. 日历组件:补卡日历用 Taro 生态跨端组件,别自写两套
4. 本地存储:小程序 `Taro.setStorage` vs H5 `localStorage` → 由 storage 适配层兜住

#### 踩坑记录(2026-06,搭首页时遇到并解决)

- **`designWidth` 必须设 `375`,不能用 Taro 默认 `750`**(`config/index.ts`,配 `deviceRatio { 375: 2 }`)。
  - 现象:小程序 + H5 两端 UI 整体等比缩小约一半,字号/间距/触摸区全偏小。
  - 根因:设计稿 `design/tokens.css` 按 ~390 逻辑宽画,token 全是真实 CSS px(`--fs-mega:72px`、`--touch:44px`)。`designWidth:750` 让 Taro 把这些 px 当"750 设计稿单位"按 1:1 转换 → 小程序出 `--fs-mega:72rpx`(750rpx=满屏,375 屏 1rpx=0.5px → 渲染 36px);H5 出 `--fs-mega:1.8rem` + 根字号脚本 `40*w/750`(375 屏根字号 20px → 36px)。两端都减半。
  - 解决:改 `designWidth:375` → 小程序 `144rpx`、H5 `3.6rem` + 脚本 `20*w/375`,两端还原成 72px,与设计稿对齐。
  - 注意:H5 用 **rem**(不是 vw),同样受 `designWidth` 影响,不要误以为只有小程序受影响。
  - 诊断手法:grep 产物 token 编译值——小程序看 `dist/weapp/**/*.wxss` 应是 `--fs-mega:144rpx`,H5 看 `dist/h5/css/*.css` 应是 `3.6rem`(若是 `72rpx`/`1.8rem` 即减半信号)。
- **改 `config/index.ts` 后必须重启 dev server**。`pnpm dev:h5` / `dev:weapp` 是 watch 进程,启动时只读一次配置,运行中改 config 不热重载——否则浏览器怎么刷新都"没变化"。改完构建配置先 `pkill` 掉旧 watch 再重启。
- **设计令牌选择器要写 `:root, page`**(`src/styles/tokens.scss`),不能只写 `page`。`page` 是小程序概念,H5 根是 `<html>`,只挂 `page` 会让 H5 全部 `var(--c-*)` 失效、整页颜色丢失。同理全局底色用 `body, page`。
- **`@/*` 路径别名要在 `config/index.ts` 的 `alias` 里单独配**。Taro vite 构建不读 tsconfig paths,只配 tsconfig 会 typecheck 通过但构建报 `Rollup failed to resolve import "@/..."`。

## 五、core 模块设计

```
core/
├─ types.ts      Card / CheckIn / CalcResult
├─ calc.ts       calcCard():卡+打卡 → 所有数字
├─ feedback.ts   状态分级、负反馈三档、转折/沉没成本判定
└─ calc.test.ts  单元测试(原型 node 验证用例正式化)
```

原则:
- **纯函数、无副作用、不碰时间**:`calcCard(card, today)`,"今天"作参数传入 → 可测
- **不依赖框架**:纯 TS,仅依赖 dayjs(日期运算,挂 utc 插件强制 UTC、不碰本地时区),node/浏览器/小程序/将来后端都能跑

## 六、存储与后端

### 存储适配接口(预留云的核心)

```typescript
interface IStorage {
  loadCards(): Promise<Card[]>
  saveCard(card: Card): Promise<void>
  deleteCard(id: string): Promise<void>
  sync?(): Promise<void>           // 将来云同步
  bindUser?(userId: string): Promise<void>
}
```

- **全部异步**:本地存储也包成 Promise,将来接云不改调用方
- 业务层只调 `IStorage`,不直接碰 localStorage → 切云只换一个实现

### 同步元信息(建表/建模型时就带上)

```typescript
interface Card {
  id: string
  // ...业务字段
  updatedAt: number    // 最后修改时间,用于冲突合并(最后写入胜出)
  deleted?: boolean    // 软删除,不真删(否则同步时被删项会被推回)
  _dirty?: boolean     // 本地改过未同步
}
```

### 后端:Supabase(验证出价值后再接)

- 选 Supabase:四端中立(不绑微信)、React SDK 一流、底层 Postgres 灵活、免费额度够验证
- 不选微信云开发:小程序内最爽,但四端要绕、绑死微信生态
- **账号是真正难点**:用 Supabase user id 作数据归属唯一锚点,微信 openid / 手机号都只是登录方式,指向同一 user
- **安全红线:必须开 RLS**(行级权限),规则=用户只能读写 `user_id=自己` 的行。不开则数据公网裸奔
- 两张表:`cards` / `checkins`,均含 `user_id` + `updated_at` + `deleted`

### 后端落地节奏

```
阶段0(现在)    纯本地 storage/local.ts,不碰后端 —— 先验证产品
阶段1(有人用)   接 Supabase:两张表 + RLS + 单端登录 + cloud.ts
阶段2(多端留存) 四端账号打通(微信+手机号 → 同一 user)
阶段3(要变现)   付费表 + 微信支付(小程序内虚拟付费强制用微信支付,有审核要求)
```

## 七、动效策略(定调:先朴素、验证后再加)

### 硬约束:小程序不是浏览器

小程序双线程、无 DOM,GSAP/Framer Motion 操作 DOM 部分、标准 Three.js 用不了;
主包 2MB 限制,动画资源不能堆太多。故"多用库让逻辑简单"在 H5 成立,小程序需分端。

### 分端降级策略(验证后执行)

| 用途 | H5/Web | 小程序 | 跨端 |
|---|---|---|---|
| 数字滚动(灵魂) | react-spring | 手写 CSS+定时器 | 分端(都自己掌控,不赌库) |
| 转折/庆祝特效 | Lottie | lottie-miniprogram | ✅ 通用(首推,设计师给 JSON) |
| 3D 亮点 | react-three-fiber | 不做 | 仅 H5 |
| 滑动切卡 | Taro swiper | Taro swiper | ✅ 通用 |

原则:小程序保"能用不卡有基本动效",H5 放开了炫;**粘性来自"单价掉下来"的数据反馈本身,动画只是放大它**。

## 八、第一步落地动作

零返工风险、纯赚:**把原型验证过的计算逻辑抽成 `core` 模块(TS + 单元测试)**。
与框架/后端/动效均无关,是整套架构地基。

## 九、待展开(尚未讨论)

- 埋点/验证数据:打卡次数、留存、转折触发率、付费转化(与产品验证强相关,别拖太晚)
- monorepo 工具链:pnpm / turborepo 具体配置
- CI/部署:H5 静态托管、小程序 miniprogram-ci 上传(验证期可手动)
- 云同步的具体冲突合并策略
