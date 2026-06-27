# 复盘屏（屏 6）开发方案

落地原型屏 6「到期复盘 · 指导下次决策」。MVP 最后一块核心屏，对齐 README 功能5 + TODO 防陷阱 C。

## 已确认决策
1. **「下次怎么选」做定性建议**：不要求输入月卡价。core 加纯函数产「值不值」枚举，UI 映射文案。
2. **两个入口都接**：总览「待复盘」卡 + 过期卡「看复盘」按钮 → 同一 `activeTab='review'` 视图态（沉一个 reviewCardId）。
3. **续卡预填表单**：「续这张卡·开新周期」跳添加卡表单，预填上期卡名/总价/卡型/次数，购买日=今天。

## 架构遵守 + core 改动（这次需要动 core）
core 当前 CalcResult 已有结算所需数字（`realUnitCost`/`checkInCount`/`savedVsExpected`/`wastedUnused`/`expectedPrice`）。唯一缺「下次怎么选」的判定——按 core 输出契约（[[core-output-contract]]：core 只产枚举不产文案），加一个**纯函数产枚举**：

### packages/core 改动
- `types.ts` 新增 `ReviewVerdict = 'worthIt' | 'soso' | 'notWorth'`（复盘结论枚举）。
- `feedback.ts` 新增 `getReviewVerdict(result: CalcResult): ReviewVerdict`：纯函数，依据
  - `worthIt`（这卡你用得很值）：有心里价且 `belowExpected`（最终单价 ≤ 心里价）；或无心里价但 checkInCount 足够多（频率高）。
  - `notWorth`（用得太少，下次别办这么大的）：单价远高于心里价（如 realUnitCost > expectedPrice * 2），或有限次卡 wastedUnused 占比高（如未用 > 总价 50%）。
  - `soso`（中间档）：其余。
  - 判定全用已有 CalcResult 字段，不引入新输入。具体阈值沿用「暂定、可调」惯例，注释标注。
- core 加单测覆盖三档（保持 42→更多用例全绿）。
- **不产文案**：UI 按枚举映射「这张卡你用得很值 / 还算划算 / 下次别办这么大的卡」。

### store 改动（useCardStore.ts）
- `ViewTab` 扩 `'review'`。
- 新增 `reviewCardId: string | null`（复盘哪张卡）。
- 新增 action `openReview(cardId)`：设 reviewCardId + activeTab='review'。
- 续卡预填：新增 `prefillCard: NewCardInput | null` 状态 + action `startRenew(card)`：把上期卡信息存进 prefill，切到 add tab。AddCardForm 读 prefill 初始化。addCard 后清 prefill。

## UI 改动

### 新组件 pages/index/ReviewScreen.tsx (+ .scss)
- 自算：传入 card，内部 `calcCard` + `getReviewVerdict`（与 CardSlide 同模式）。
- **结算总票**（Ticket toothed）：
  - mono-cap「FINAL RECEIPT · 结算总票」
  - 圆形大对勾印章（verdict=worthIt 绿 / soso 黄 / notWorth 灰），Icon name=check。
  - 标题：按 verdict 映射文案。
  - 副标「{卡名} · 共去 {checkInCount} 次」。
  - LineItem：「最终每次只花 ¥{realUnitCost}」+（有心里价时）「你心里价 ¥{expectedPrice}」。
  - 强调行「比单次买省下 ¥{savedVsExpected}」（绿；为负则红显「多花」）。有限次有浪费时补一行「没用完浪费 ¥{wastedUnused}」。
- **下次怎么选黑票/黄票**（alert 黄底）：灯泡 Icon + 「下次怎么选」+ 按 verdict 映射的建议文案。
- 按钮「续这张卡 · 开新周期」（Button ink）→ startRenew。
- 「导出这张卡的数据 ›」：留 comingSoon（数据导出整体留「我的」页做）。
- 顶部 AppBar showBack（返回来源：从总览来回总览、从打卡来回打卡——简单起见统一返回 checkin，或记来源。**采用**：统一 onBack 回 checkin tab，够用）。

### pages/index/index.tsx
- 加 `isReview = activeTab === 'review'`，body 分支渲染 ReviewScreen（取 reviewCardId 对应卡）。
- AppBar：review 态 showBack + 标题「{卡名}到期复盘」或通用「到期复盘」。
- 入口接线：
  - 过期卡 CardTicket 的「已过期·看复盘」按钮 onClick → openReview(card.id)（当前走 comingSoon/onBackfill，需改）。注意：该按钮当前 disabled，需改成可点（过期态按钮不该 disabled，应能点进复盘）。
  - 总览 OverviewView 的 onSelect：待复盘卡（status==='review'）点击 → openReview，其余 → selectCard。需给 OverviewList 行区分 status 透传。
- review/add 态 TabBar active 兜 'checkin'。

### AddCardForm.tsx（续卡预填）
- 接受可选 prefill（从 store 读 prefillCard）初始化 useState 默认值。
- 不传则空表单（现状）。

### i18n（zh.ts review 段）
- `finalReceipt`、三档标题（`titleWorth`/`titleSoso`/`titleNotWorth`）、副标 `subtitle`、行 label（`finalUnit`/`yourWorth`/`savedVs`/`wastedUnused`）、`nextTitle`「下次怎么选」、三档建议（`adviceWorth`/`adviceSoso`/`adviceNotWorth`）、`renew`「续这张卡 · 开新周期」、`exportData`。

## 边界兜底
- savedVsExpected 为 null（无心里价/未打卡）：省下行改显中性或藏。
- 无打卡的过期卡（checkInCount=0）：单价破折号，verdict 走 notWorth，文案「这卡几乎没用」。
- 不限次卡无 wastedUnused，藏该行。

## 验证
- `pnpm core:test` 新增 verdict 用例全绿；`pnpm typecheck` 全绿。
- H5 截图：①过期卡看复盘进入 ②总览待复盘卡进入 ③三档 verdict 视觉 ④续卡预填表单。

## 不做（留下一步）
- 数据导出（归「我的」页）。
- 月卡价精算（这版定性建议；验证后再加输入）。
- 「我的」页本体。
