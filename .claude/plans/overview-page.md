# 总览页开发方案

## 目标
落地原型屏 7「总览页」：顶部汇总票（比单次买总共省下 +¥X + 在用/在亏/已结束计数）+ 卡列表（每张卡状态印章 + 单价摘要）。点任一张卡 → 回打卡屏并切到该卡。

## 已确认决策
1. **导航**：单页内视图切换。`index` 页用 `activeTab: 'checkin' | 'overview'` 状态切换，不新建 Taro 页面、不动原生 tabBar。`TabBar.onChange` 改 store 状态。「我的」tab 仍走 `comingSoon()`。
2. **范围**：总览 + 点卡联动。顺带激活首页写死的 `activeIdx`——改为按 `cardId` 选卡。
3. **汇总口径**：按心里价求和，复用 core 的 `savedVsExpected`。只统计填了心里价的卡；负数显示「在亏」。

## 架构遵守
- core / storage **零改动**。`calcCard` + `getFeedback` 已能产出总览所需全部数字（`status` = active/burning/review 正好对应 在用/在亏/待复盘；`savedVsExpected`、`realUnitCost`、`remainingTimes` 等）。
- store 只存原始数据，总览的汇总/每卡摘要**渲染时实时算**，不入库。
- 选卡状态属 UI 态，放 store（`activeCardId` + `activeTab`），不持久化。

## 改动清单

### 1. store/useCardStore.ts
- 新增 UI 态：`activeTab: 'checkin' | 'overview'`（默认 checkin）、`activeCardId: string | null`。
- 新增 action：`setTab(tab)`、`selectCard(cardId)`（选卡 + 切回 checkin tab）。
- `load()` 结束后若 `activeCardId` 为空，默认选第一张卡。
- 不改 cards/checkins 原始数据结构与 core/storage 调用。

### 2. 新组件 components/OverviewList.tsx (+ .scss)
纯展示组件，props 接已算好的数据，不在组件内碰 store/core（与现有组件库一致：纯展示、color 走 var(--c-*)）。
- `SummaryTicket`：深色票（`--c-ink-paper` 底 + `--c-on-ink` 字），hero 大数字显省/亏金额（省绿 `--c-save` / 亏红 `--c-burn`），下方三个计数（在用/在亏/已结束）。
- `CardRow`：复用 `<Ticket flat>` 做扁平行——卡名+卡型、单价/次数摘要、状态 `<Stamp>`（save=越用越省 / burn=在亏钱 / 待复盘虚线灰）、右侧 chevron。点击回调 `onSelect(cardId)`。
- 导出加入 `components/index.ts`。
- props 形如 `{ summary, rows, onSelect }`，由页面层组装（页面调 core 算）。

### 3. pages/index/index.tsx
- 订阅 `activeTab` / `activeCardId` / `setTab` / `selectCard`。
- `card` 由 `activeIdx` 写死 0 改为按 `activeCardId` 查找（兜底第一张）。
- `body` 按 `activeTab` 条件渲染：checkin → 现有 `CardTicket`；overview → 新增 `OverviewView`（页面内组装函数：遍历 cards 调 `calcCard`/`getFeedback` 算每行摘要 + 汇总，传给 `OverviewList`）。
- `TabBar.active={activeTab}`，`onChange`：checkin/overview 切 tab，me 走 comingSoon。
- AppBar 标题随 tab 切换（打卡屏「我的卡」/ 总览「总览」）。
- 点卡 `onSelect` → `selectCard(id)`（切回打卡屏并定位该卡）。Dots 的 activeIndex 也跟随 activeCardId。

### 4. i18n/locales/zh.ts
新增 `overview` 段：
- `summaryCap`（至今汇总/TOTAL）、`savedTotal`/`lostTotal`（比单次买总共省下/在亏）、计数标签 `countActive`/`countBurning`/`countReview`。
- 列表区：`listCap`（我的卡 · N · 点任一张进去打卡）、行摘要 `rowUnit`（已去 N 次 · ¥X/次）、`rowLimited`（用 a/b · ¥X/节）、状态印章 `stampSave`/`stampBurn`/`stampReview`、少样本行 `rowFewSample`。

## 汇总算法（页面层，纯读 core 输出）
```
对每张未删卡 c：calc = calcCard(c, checkinsOf(c), today)；fb = getFeedback(calc)
- savedTotal += calc.savedVsExpected ?? 0   // 仅填心里价且已打卡的卡贡献
- 按 fb.status 累加 active/burning/review 计数
汇总票主数字 = savedTotal（>0 显「省下 +¥」绿，<0 显「在亏 ¥」红，=0 显中性）
```

## 边界兜底
- 单卡（示例卡）时总览也成立：列表 1 行 + 汇总。
- 全是没填心里价的卡 → savedTotal=0，显中性文案（不显误导的 +¥0）。
- 少样本卡行：单价未达样本不显 ¥，改显「再打 N 次」摘要（复用 calc.enoughSample）。
- 过期卡 status=review，归「已结束」计数，行显待复盘印章。

## 验证
- `pnpm typecheck` 全绿。
- `pnpm core:test` 不受影响（core 未改）应仍 42 绿。
- H5 截图核对总览布局（参照 memory 的 H5 视觉验证手法），重点：深色汇总票对比度、列表行点击切卡、tab 高亮。

## 不做（留下一步）
- 「待复盘」卡点进去的复盘屏（屏 6）——总览先标印章，点击暂仍切打卡屏。
- 「我的」tab、添加卡表单、补打入口——维持 comingSoon。
