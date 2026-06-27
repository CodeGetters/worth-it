# index.tsx 组件瘦身拆分方案

把 652 行的 index.tsx 拆薄:打卡屏、总览屏抽成独立文件,与已独立的 AddCardForm/ReviewScreen 对齐。**架构不变**——仍是单 page、`activeTab` 切视图、共享 useCardStore 状态。零行为变化、零路由改造。

## 目标产物

`pages/index/` 下文件布局(新增 4 个,index 大幅瘦身):

```
index.tsx          壳:Index 组件 + 路由分支 + 共享状态/handlers（~230 行）
index.scss         保留壳 + 打卡屏样式（暂不拆 scss，见下）
shared.ts          新增:Flash 类型、comingSoon、stampText 等跨屏共享
CheckinScreen.tsx  新增:CardSlide + CardTicket + FewSample + DeltaHint（打卡屏全部）
CheckinScreen.scss 新增:从 index.scss 切出打卡屏样式
OverviewScreen.tsx 新增:OverviewView + rowSummary（总览屏）
AddCardForm.tsx    不动（已独立）
ReviewScreen.tsx   不动（已独立）
```

## 拆分细节

### 1. 新建 `shared.ts`(跨屏共用的小工具/类型)
- `Flash` 接口(被壳 + 打卡屏共用)。
- `comingSoon()` 函数(壳 + 打卡屏 onExport 等多处用)。
- `stampText(status)`(总览屏用,但概念上是状态→印章文案映射,放 shared 合理)。
- **不放** `turnToToast`/`ToastMsg`:只有壳 Index 用(打卡后副作用),留在 index.tsx。

### 2. 新建 `CheckinScreen.tsx`
搬迁:`CardSlide`、`CardTicket`(含 CardTicketProps)、`FewSample`、`DeltaHint`。
- 这些组件的 props 已经是显式传入(card/calc/flash/onCheckIn/onUndo/onBackfill/onReview),搬迁后只需补 import。
- 对外导出 `CardSlide`(壳在 Swiper 里渲染它)。CardTicket/FewSample/DeltaHint 是 CheckinScreen 内部细节,不导出。
- import:`@worthit/core`(calcCard/getFeedback/detectTurningPoint/类型)、`@/components`、`./shared`(Flash)、`../../utils/date`、`../../i18n`。

### 3. 新建 `OverviewScreen.tsx`
搬迁:`OverviewView`(改名导出保持一致)、`rowSummary`。
- `stampText` 移到 shared.ts(OverviewView 用)。
- import:core、`@/components`(OverviewList 等)、`./shared`、date、i18n。

### 4. `index.tsx` 瘦身后只剩
- `turnToToast` + `ToastMsg`(打卡副作用,壳用)。
- `Index` 组件:状态(cards/checkins/flash/toast/各 ref)、所有 handlers(handleCheckIn/handleUndo/handleBackfill/handleSwiperChange/handleTab/handleOverviewSelect/clearFlash)、useEffect(load/flash 副作用/review 防御)、return(AppBar + 路由分支 + TabBar + Toast)。
- import 改为从 `./CheckinScreen` 引 CardSlide、`./OverviewScreen` 引 OverviewView、`./shared` 引 Flash/comingSoon。

### 5. scss 处理
- index.scss 含打卡屏样式(`.checkin`/`.ticket-*`/`.fewsample` 等)。这些 class 由 CheckinScreen 的 JSX 用。
- **方案**:切出打卡屏专属样式到 `CheckinScreen.scss`,由 CheckinScreen.tsx import;index.scss 只留壳级(`.checkin` 根布局 + body)。
- 谨慎:`.checkin` 根布局类壳和打卡屏都涉及,需判断归属。**保守做法**:scss 暂不拆(样式靠全局 class 名匹配,拆不拆都能工作),只拆 tsx。先让 tsx 瘦身落地、验证无回归,scss 作为可选后续。
- **决定**:本轮只拆 tsx + 新建 shared.ts;scss 保持 index.scss 不动(CheckinScreen 用的 class 仍在全局生效)。降低风险。

## 风险控制
- 纯搬迁,不改任何逻辑/JSX 结构/class 名。
- 每个组件搬迁后立即补全 import,靠 typecheck 兜住漏引用。
- 搬迁后 lint(检查 unused import)+ typecheck + H5 截图核对四屏(打卡/总览/添加/复盘)无视觉回归。

## 验证
- `pnpm typecheck` + `pnpm lint` 全绿。
- `pnpm build:h5` 成功。
- H5 截图:打卡屏(含少样本/正常态)、总览屏、添加屏、复盘屏,确认与拆分前一致。
- core 未动,不必重测(但会顺带跑 core:test 确认没误伤)。

## 不做
- 不改单页架构(不引入 Taro 多 page 路由)。
- 不拆 scss(留作可选后续)。
- 不改任何组件逻辑或文案。
