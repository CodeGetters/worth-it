# 打卡页面完善方案（对齐原型 checkin.js 灵魂反馈）

补四块原型有、当前缺的「灵魂反馈」。全部在 app 层 + core 加一个枚举，遵守既有契约。

## 四块改动

### 1. 断卡回归反馈（welcomeBack）— 需动 core
- `types.ts`：`TurningPoint` 加 `'welcomeBack'`。
- `feedback.ts` `detectTurningPoint`：开头加判定——`before.breakDays > 0 && (after.breakDays ?? 0) === 0` → `welcomeBack`（断卡状态下打了一卡，回归）。优先级最高（放 fullPaid 前），对齐原型 `if (wasBroken)` 最先判。
- core 加单测覆盖。
- UI：welcomeBack 文案已备（`feedback.turn.welcomeBack`），接进 Toast/印章呈现。

### 2. 里程碑 Toast（替换呈现方式）— 关键决策见下
原型 `doCheckIn` 的三类里程碑（回归 / 划算了 / 单价大跌）用**居中盖章式 Toast**：黄底硬描边 + 偏移硬影 + 旋转 -4° + spring 缩放弹入，1.8s 后消失，大字 + 小字两行。Taro.showToast 系统样式做不出这个，需**自绘 Toast 组件**。

**新组件 `components/Toast.tsx` + `.scss`**（移植自 checkin.html .toast）：
- props：`show` / `big` / `small?` / `onHide`。
- 绝对定位居中、z-index overlay、spring transition、自动 1.8s 隐藏。
- 导出到 components/index.ts。

**呈现取舍（决策点）**：当前转折用「票面内 Stamp 印章」（常驻到下次打卡）。两种方案：
- **方案 A（推荐，对齐原型）**：里程碑（welcomeBack / becameGoodDeal / bigDrop / fullPaid）改走 Toast 弹一下；票面内只保留「常规 delta（这次便宜 ¥X）」小印章 + hint。职责清晰：瞬时高光走 Toast，持续状态留票面。
- 方案 B：Toast 和票面印章都弹（信息重复，不取）。
→ 按 A 实现：DeltaHint 里 turn 命中时不再渲染大印章，改为父层触发 Toast。

### 3. 打卡物理反馈（震动 + 按钮盖章手感）
- 震动：`handleCheckIn` 成功后 `Taro.vibrateShort()`（对齐原型 `navigator.vibrate(12)`）。包 try/catch，H5/不支持端静默。
- 按钮 bump：Button 现仅 `:active` 位移。原型打卡后按钮主动「盖章回弹」一下（非按下，是程序触发）。给打卡按钮加一个一次性动画 class，打卡后触发。**简化**：依赖现有 `:active` 已有手感，bump 锦上添花——若实现成本高可只做震动。倾向都做：CardTicket 加个 `justChecked` 态驱动按钮 className。

### 4. 首次引导文案（deltaTryFirst）
- 文案已备（`checkin.deltaTryFirst`：去一次试试，看单价怎么掉）。
- 现状：少样本（新卡/示例卡未打卡）显 FewSample「再打 N 次...」。deltaTryFirst 更适合**刚好 0 次打卡**时作引导。
- 接入：FewSample 区，当 `checkInCount === 0` 时除了「再打 N 次」标题，补一行 deltaTryFirst 引导（或替换 desc）。对齐原型「去一次试试」的首触发引导。

## i18n
- 已备文案：welcomeBack、deltaTryFirst 都在 zh.ts，直接用。
- Toast 可能需要里程碑的「大字/小字」拆分文案（如「划算了!」+「每次 ¥X，已低于心里价」）。现有 `feedback.turn.*` 是单行，需为 Toast 加 big/small 两段，新增 `feedback.toast.*` 段。

## 边界
- Toast 与切卡/切 tab：切走时清掉 Toast（已有 setFlash(null) 时机，加 setToast(null)）。
- 补打（过去日期）不弹里程碑 Toast（补打不设 flash，已有逻辑天然满足）。
- welcomeBack 与 becameGoodDeal 同时满足（断卡回归且刚好跨过心里价）：welcomeBack 优先。

## 验证
- `pnpm core:test`：welcomeBack 新用例 + 现有全绿。
- 改了 core → 先 `pnpm core:build` 再 `pnpm build:h5`（见 [[h5-build-reads-core-dist]]）。
- `pnpm typecheck` 全绿。
- H5 截图：①断卡卡打卡弹「欢迎回来」Toast ②跨心里价弹「划算了」③新卡 0 次显 deltaTryFirst 引导。Toast 是瞬时态，截图需 CDP 在弹出窗口期抓。

## 不做（留下一步）
- 真机震动验证（H5 无震动，仅小程序/真机生效，本轮只接 API）。
- prefers-reduced-motion 下 Toast 降级（useRollNumber 已处理动画降级，Toast 可后续对齐）。
