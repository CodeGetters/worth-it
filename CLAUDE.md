# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

「值啦 / Worthit」是一个打卡看真实单价往下掉的轻量工具:用户给办过的卡（健身年卡、私教课包等按次消费的卡）打卡,看真实单次成本 = 总价 ÷ 实际打卡次数 一次次下降。追求最快验证、最低成本。产品方案见 `README.md`,技术决策见 `TECH_PLAN.md`,已决策/待办见 `TODO.md`。

## 当前状态:脚手架阶段

monorepo 骨架已搭好,但**核心业务逻辑尚未实现**:

- `packages/core/src/calc.ts` 的 `calcCard()` 仍 `throw new Error('尚未实现')`
- `packages/core/src/feedback.ts` 是空占位（状态分级/负反馈/转折判定全是 TODO）
- `apps/taro-app/src/pages/index/index.tsx` 是占位首页,没有真正的打卡屏

落地这些逻辑时,**从 `design/prototype/checkin.js`（已验证过的原型）抽取并翻成 TS**。`design/` 下还有 `index.html` / `desktop.html` / `mobile.html` 等交互原型与 `tokens.css` 设计变量,是实现界面与算法的参考来源。

## 常用命令

monorepo 用 pnpm（`packageManager: pnpm@10.14.0`,Node >= 20）。所有命令在仓库根运行:

```bash
# 安装
pnpm install

# core 纯逻辑（最先落地、依赖极简、可独立验证）
pnpm core:build          # tsc 编译
pnpm core:test           # vitest run（一次性跑）
pnpm --filter @worthit/core test:watch   # 监听模式
pnpm --filter @worthit/core test -- calc # 跑单个测试文件（按文件名过滤）

# storage 存储适配层
pnpm storage:build

# 一次性构建所有 packages（apps 依赖它们）
pnpm build:packages

# Taro 应用：一套代码编双端
pnpm dev:h5              # H5 开发（watch）
pnpm dev:weapp           # 微信小程序开发（watch，产物在 apps/taro-app/dist/weapp，用微信开发者工具打开）
pnpm build:h5            # H5 生产构建
pnpm build:weapp         # 小程序生产构建

# 全仓校验
pnpm typecheck           # 各包 tsc 类型检查（递归）
pnpm lint                # eslint . --ext .ts,.tsx
pnpm format              # prettier 全量格式化
```

改动 `packages/*` 后,Taro 应用通过 tsconfig path 直接指向源码（`@worthit/core` → `../../packages/core/src/index.ts`),开发时无需先 build；但 `pnpm typecheck` 和发布构建仍依赖各包正确编译。

## 架构:计算逻辑与界面彻底分离

核心思想是**纯算法是同一份 TS,四端共享、永不返工**。三层从下往上:

```
packages/core/      纯 TS,仅依赖 dayjs,零框架 —— 四端共享的计算与反馈逻辑
   ├─ types.ts      Card / CheckIn / CalcResult 数据模型
   ├─ calc.ts       calcCard(card, checkIns, today) → 派生数字
   └─ feedback.ts   状态分级 / 负反馈递进 / 转折判定
        ↑
packages/storage/   统一 IStorage 接口,屏蔽各端存储差异
   ├─ types.ts      IStorage（全异步,预留 sync/bindUser 接云）
   ├─ kv-driver.ts  KVDriver 底层 KV 抽象（web localStorage / 内存兜底）
   └─ local.ts      LocalStorage：软删除 + upsert,只依赖注入的 KVDriver
        ↑
apps/taro-app/      Taro + React + TS,编译微信小程序 + H5
   ├─ services/storage.ts  注入 taroKVDriver,导出全局 storage 实例
   └─ src/pages/...        页面/组件,状态用 Zustand（尚未接入）
```

### 必须遵守的设计原则

这些原则贯穿整个代码库,改动时不要破坏:

1. **core 是纯函数,不碰时间、无副作用**。`calcCard(card, checkIns, today)` 把「今天」作参数传入,保证可测、可在 node/浏览器/小程序/将来后端都跑。core 不读系统时间(日期运算走 `dayjs.utc`,挂 utc + customParseFormat 严格解析,不碰本地时区),也不得 import 任何框架或 Taro API。

2. **store 只存原始数据,派生数字实时算**。store/storage 里只存 `cards` 和 `checkins` 原始记录,所有单价/回本/负反馈渲染时调 core 现算,**绝不入库**。单一真相,避免「存了旧单价忘更新」的 bug。

3. **业务层只调 `IStorage`,绝不直接碰 `localStorage` / `Taro.setStorage`**。各端存储差异由 `KVDriver` 注入兜住（H5 用 `webKVDriver`,小程序在 `apps/taro-app/src/services/storage.ts` 注入 `taroKVDriver`）。切到云端时只换一个 IStorage 实现,调用方不动。

4. **每条记录自带同步元信息**（`updatedAt` / `deleted` / `_dirty`）,接云前也维护。删除走**软删除**（置 `deleted=true` 留墓碑,不真删,否则同步时被删项会被对端推回）。`loadCards`/`loadCheckIns` 默认过滤已删项。

5. **计算边界必须兜底**(见 README「关键计算逻辑」):除零（未打卡显破折号不显天价）、有限次打满冻结、过期停止预测、少样本（前 7 天/前 3 次）不给预测、补卡只能补「购买日~今天」。

### Taro 跨端注意

- 样式单位 `px` 自动换 `rpx`（`designWidth: 750`）,H5 表现需单独测,尤其「大数字怼脸」。
- 小程序是双线程、无 DOM,GSAP/Framer Motion/标准 Three.js 用不了,主包 2MB 限制。需分端的代码用 `process.env.TARO_ENV` 区分。
- 动效定调「先朴素、验证后再加」,第一版所有端只做最朴素动画,先把核心闭环跑顺。

### 后端节奏

当前是**阶段 0:纯本地**,不碰后端。数据模型已按「绑用户、可同步」设计好。将来接 Supabase（两张表 `cards`/`checkins`,必须开 RLS 行级权限),新增 `packages/storage/src/cloud.ts` 实现同一 `IStorage` 接口即可,业务层零改动。
