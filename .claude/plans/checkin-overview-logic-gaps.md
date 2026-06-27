# 打卡屏 / 总览屏 逻辑补全方案

补三处对照 README + 已验证原型 checkin.js 仍缺的逻辑。core 计算已齐全，本轮基本只动 app 层（过期拦截放 app，core 保持纯）。

## 决策（已确认）
- 切卡：Taro 内置 **Swiper**（跨端、原生手势），与 Dots / 总览点卡双向同步 activeCardId。
- 补打：Taro 内置 **Picker mode=date**，start=购买日、end=今天，选完调 `checkIn(cardId, date)`。

---

## 1. 修过期可打卡 bug（最高优先，真实 bug）

**根因**：`handleCheckIn` 只挡 `calc.full`，未挡 `calc.expired`；过期卡能继续打卡、单价继续掉，违背 README「已过期：停止预测、冻结最终单价、引导去复盘」。

**改 `pages/index/index.tsx`**（不动 core——core 是纯数字事实，"过期后禁止打卡"是产品交互决策，归 app）：
- `handleCheckIn`：开头加 `if (calc.expired) return`。
- `CardTicket` 操作区：过期时打卡按钮禁用并改文案。新增逻辑——
  - `expired && !full` → 按钮 disabled，文字走新 i18n `checkin.btnExpired`（"已过期 · 看复盘"），点击走 `onBackfill` 同款占位（复盘屏未建，暂 `comingSoon`）。
  - 既有 `full` 分支保留。
- 过期态价格标签：`broken ? priceLabelBreak : expired ? expiredLabel : priceLabelNormal`，并把已定义未用的 `checkin.expiredFrozen` 用起来（或新增 `priceLabelExpired`）。
- 按钮禁用判定从 `disabled={calc.full}` 改为 `disabled={calc.full || calc.expired}`。

## 2. Swiper 左右滑切多卡

**改 `pages/index/index.tsx` + `index.scss`**：
- 打卡视图（非 overview 分支）用 `<Swiper>` 包裹，每张卡一个 `<SwiperItem>` 渲染 `CardTicket`。
- `current={activeIdx}`，`onChange={e => selectIdx(e.detail.current)}` → 新 store action 或复用 selectCard（按 index 取 cardId）。
- Dots 保留在 Swiper 上方，跟随 activeIdx。
- **关键交互处理**：
  - 切卡时清 `flash`（避免旧卡的 delta 串到新卡）——在 onChange 里 setFlash(null)。
  - `beforeRef` 是打卡瞬时比对用，切卡不影响（切卡不进 handleCheckIn）。
  - 每个 SwiperItem 内的 calc 需按各自卡算 → CardTicket 内部已接 props，但当前 calc 在父层只算 activeIdx 一张。重构：把「算 calc/feedback/checkins」下放，或对每张卡都算。**采用**：渲染所有卡的 SwiperItem，但仅当前卡算 calc（性能 + 滚动动画只在当前卡触发）。非当前卡用轻量占位或也算（卡数量级很小，直接都算更简单、无闪烁）。倾向「都算」，简单可靠。
  - `PriceDisplay` 数字滚动：切卡时 value 从 A 卡价跳到 B 卡价会触发一次滚动。需求上切卡不该滚（那是"换了张卡"不是"单价掉了"）。解决：给 CardTicket / PriceDisplay 传 `animate` 仅在「同卡打卡」时为 true。简化方案——用 key={card.id} 让换卡时 PriceDisplay 重新挂载（useRollNumber 初始值即终值、不滚），同卡打卡时 value 变化才滚。**采用 key=card.id**。
- H5 Swiper 高度需显式撑满（Swiper 默认 150px 高），`.checkin__swiper { flex:1 }` + SwiperItem 内布局。这是 Swiper 跨端最常见坑，需 H5 实测。

## 3. 补打日期 Picker

**改 `pages/index/index.tsx`**：
- `onBackfill` 从 comingSoon 改为打开 Picker。用 `<Picker mode="date" start={card.purchaseDate} end={today()} onChange={e => checkIn(card.id, e.detail.value)}>` 包住「补打过去的卡 ›」那个链接。
- 边界：start/end 已由 Picker 限制在购买日~今天，core 的 validCheckIns 也再兜一层（越界不计入），双保险。
- 补打后同样触发 flash？补打是过去的日期，不应弹"这次便宜"的即时反馈（那是"今天去了"的爽感）。补打只刷新数字，不设 flash。→ 新增 `checkInAt(date)` 路径或在调用处不写 beforeRef。**采用**：补打直接 `await checkIn(card.id, date)`，不设 beforeRef，故 flash 不触发。
- 注意：当前 backfill 链接仅在 `checkInCount === 0` 时显示（与撤销二选一）。补打应任何时候可用。**调整**：操作区底部始终显示补打入口，撤销在有打卡时额外显示。重排操作区。

## i18n 新增（zh.ts checkin 段）
- `btnExpired`: '已过期 · 看复盘'
- `priceLabelExpired`: '这张卡已到期，最终单价冻结在'（或复用 expiredFrozen）
- 补打 Picker 无新增文案（用现有 backfill）。

## 不做（留下一步）
- 复盘屏（屏6）本体：过期卡「看复盘」入口暂仍 comingSoon。
- welcomeBack（断卡回归 toast）、震动、deltaTryFirst：归动效阶段。
- 添加卡表单、我的 tab。

## 验证
- `pnpm typecheck` 全绿；`pnpm core:test` 不受影响（core 未改）应仍 42 绿。
- H5 headless 截图核对：①过期卡按钮禁用+文案 ②Swiper 左右滑切卡且不误触发数字滚动 ③Swiper H5 高度撑满 ④补打 Picker 唤起。重点测 Swiper 跨端高度坑。
