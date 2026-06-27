# 添加卡表单 开发方案

落地原型屏 3「开一张新票」。对齐 README MVP「添加我的卡」与已决策（能默认就默认、非必填标可先不填、年卡有效期默认今天+1年）。

## 已确认决策
1. **位置**：首页内视图态。`activeTab` 扩 `'checkin' | 'overview' | 'add'`，`+` 点击切到 add，保存/返回切回。沿用单页架构，零路由成本，store 共享。
2. **必填/校验**：按原型/README。必填卡名、总价、卡型（默认不限次）；有限次额外必填总次数。选填心里价。有效期默认今天+1年可改。总价/次数为正数。
3. **保存后**：新卡 `selectCard(id)` 成为当前卡 → 回打卡屏，直接对新卡打卡（对齐原型「保存，开始打卡」）。

## 架构遵守
- core / storage **零改动**。`saveCard` 已存在于 storage 实例，store 缺一个 `addCard` action 包一层（写元信息 + 入内存 + selectCard）。
- 表单状态是页面局部态（useState），不进 store；只有「保存」那一刻把成品 Card 交给 store。
- 表单组件纯展示 + 受控，色彩走 var(--c-*)。

## 改动清单

### 1. store/useCardStore.ts
- `ViewTab` 扩 `'add'`。
- 新增 `addCard(input)` action：input 为表单产出的卡字段（不含 id/元信息），内部补 `id=genId('card')`、`updatedAt`、`_dirty`，调 `storage.saveCard`，push 到内存 cards，然后 `activeCardId=新id` + `activeTab='checkin'`（保存即定位+切屏）。
- 类型：定义 `NewCardInput = Omit<Card, 'id'|'updatedAt'|'deleted'|'_dirty'>`，导出给表单用。

### 2. 新组件 components/Field.tsx (+ .scss)
组件库目前无输入组件，封装一个薄输入控件（基于 Taro `Input`，受控 value + onInput→e.detail.value）：
- `Field`：label(mono-cap) + 输入框。props: `label` / `value` / `onChange` / `placeholder` / `type`('text'|'number') / `optional`(选填时框用虚线灰、对齐原型「待填用虚线灰框」)。
- 已填(有值)：墨黑硬描边 `--bd`；未填且选填：虚线灰 `1.5px dashed --c-dash` + faint 占位（对齐原型录入门槛设计）。
- 导出到 components/index.ts。
- 数字类型用 `type='number'` 传给 Taro Input 的 `type="digit"`。

### 3. 新组件 pages 内 AddCardForm（放 index.tsx 内的视图函数，或单独文件）
**采用**：单独文件 `components/AddCardForm.tsx`（表单较大，独立可测；但它依赖 i18n/store——参考 OverviewView 模式，把「组装」留在页面，纯展示留组件。这里表单交互重，直接做成接 onSubmit/onCancel 回调的组件，自管本地 useState，不直接碰 store）。
- 卡型切换：两个 ticket-flat 卡片（有限次课包 / 不限次年卡），选中黄底（对齐原型）。
- 字段：卡名(text 必填)、总价(number 必填)、总次数(number，仅有限次显示且必填)、有效期(用 Picker date，默认今天+1年)、心里价(number 选填)。
- 购买日：原型没显式让填，默认今天（年卡有效期默认购买日+1年）。第一版购买日固定今天，不暴露输入（README 默认值优先）。
- 校验：卡名非空、总价>0、有限次时总次数>0；不过则 Toast 提示具体缺项，不提交。
- 底部「保存，开始打卡」按钮（Button ink/alert）。
- 顶部用 AppBar showBack（返回切回来源 tab）。

### 4. pages/index/index.tsx
- `isOverview` 旁边加 `isAdd = activeTab === 'add'`。
- `+` 的 onClick 从 comingSoon 改为 `setTab('add')`。
- body 分支：isAdd → 渲染 `<AddCardForm onSubmit={c => addCard(c)} onCancel={() => setTab('checkin')} />`。
- AppBar：add 态显示返回箭头（showBack, onBack 切回 checkin）+ 标题「开一张新票」。当前 AppBar 首页态是 logo+标题+右+，add 态需要 showBack 形态——按 activeTab 切 AppBar 形态。
- add 态隐藏底部 TabBar？原型屏3是返回栈、无 tabbar。但单页架构下 TabBar 常驻也可接受。**采用**：add 态保留 TabBar（点 tab 可离开表单），符合单页一致性；返回箭头额外提供退出。

### 5. i18n/locales/zh.ts 新增 addCard 段
- 标题 `title`「开一张新票」、卡型 `typeLimited`/`typeUnlimited` + 各自副标、字段 label（name/totalPrice/totalTimes/expire/expectedPrice）、各 placeholder、`expireAuto`「已自动填：今天+1年」、`save`「保存，开始打卡」、校验 toast（`errName`/`errPrice`/`errTimes`）。

## 边界兜底
- 总价/次数非数字或 ≤0 → 校验拦截。
- 有效期 Picker start=今天（不能早于购买日）。
- 心里价空 → expectedPrice 不传（undefined），与现有「无心里价」逻辑一致。
- 卡型从有限次切回不限次 → 清掉 totalTimes。

## 验证
- `pnpm typecheck` 全绿；`pnpm core:test` 不受影响应 42 绿。
- H5 截图核对：①+ 进入表单 ②卡型切换黄底 ③选填虚线框/必填实框 ④填完保存回打卡屏看到新卡。

## 不做（留下一步）
- 购买日自定义输入（默认今天，复盘续卡时再说）。
- 复盘屏续卡预填表单（屏6 未建）。
