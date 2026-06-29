# 交互优化 + 按需引入组件库 方案

## 策略总纲
- **自建小票组件是资产,保留为主体 UI**(暖纸白+墨黑+撕齿+警戒黄的「清醒小票」语言,18 个组件全走 token、四端通用)。
- **NutUI React 按需引入**,只用在"自己写易出 bug 的重交互"(确认弹窗 / ActionSheet),且用 CSS 变量主题覆写映射到小票配色,避免视觉割裂。
- 通用电商风组件库**不替换**展示层(Button/Ticket/Stamp/PriceDisplay 等)。

四块交互优化(用户全选)+ 组件库集成,分阶段做。

---

## 阶段一:反馈与确认统一

### 1a. 撤销打卡加确认(引入 NutUI Dialog)
- 现状:`handleUndo` 直接删最后一条打卡,无确认。
- 做法:
  - `pnpm add @nutui/nutui-react-taro`,按 Taro 文档配 `config/index.ts` 的 `mini.postcss` / `h5` 与按需加载(babel-plugin-import 或官方 resolver)。
  - 用 NutUI `Dialog` 做撤销确认:「撤销上一次打卡?」+ 取消/确定。
  - **主题覆写**:在全局 scss 用 NutUI 的 CSS 变量(`--nutui-color-primary` 等)映射到 `--c-ink`/`--c-alert`/`--c-paper`,让弹窗呈小票风(墨黑描边、警戒黄主按钮)。
  - 若主题覆写无法贴合(验证后判断),退回自建 `ConfirmDialog`(小票风,撕齿+硬影),不强用 NutUI。
- 验证点:H5 + 小程序双端 Dialog 能弹、样式不崩。

### 1b. 应用内反馈口径统一
- 现状:`comingSoon`/表单错误用原生 `Taro.showToast`(系统样式,与小票风不搭)。
- 做法:保留 `showToast` 用于"中性系统提示"(它跨端稳、无障碍好),但表单校验错误改为**行内提示**(见阶段四),减少 toast 滥用。
- `comingSoon` 占位维持 showToast(临时占位,等「我的」页实现后移除)。

---

## 阶段二:加载态 / 空态

### 2a. 加载骨架屏
- 现状:加载时只显一个居中 app 名(`.checkin__loading`)。
- 做法:新建 `Skeleton` 组件(小票风:灰条占位,呼吸微动画),打卡屏 cards 未就绪时显票面骨架(头部条 + 大数字条 + 按钮条),替代单文字。
- store 已有 `loading` 字段,接上。

### 2b. 空数据态
- 现状:`cards.length===0` 时打卡屏掉到 `.checkin__loading`(显 app 名),总览无空态。
- 注意:当前 store 在空数据时**种示例卡**,所以正常进不了真空态。但删卡功能(后续)会触发。本阶段补**总览空态**组件(虚线框 + 加号 + 「还没有卡 · 添加第一张」黄按钮,对齐原型 mobile.html 空态),为删卡功能预备。

---

## 阶段三:微动画 / 过渡

### 3a. 视图切换过渡
- 现状:`activeTab` 切视图是硬切,无过渡。
- 做法:给 `.checkin__body` 的视图切换加轻量 fade/slide(纯 CSS,`@media (prefers-reduced-motion)` 兜底——token 已支持)。

### 3b. 打卡按钮反馈强化
- 现状:Button 有 `:active` 位移 + 震动 + Toast。
- 做法:打卡成功后,大数字区做一次轻微 "bump"(scale 1→1.04→1)配合数字滚动,强化"又掉了一截"的爽感。纯 CSS keyframe,reduced-motion 兜底。

### 3c. 卡片切换
- Swiper 已有原生滑动。补 Dots 切换的过渡平滑度检查(可能已够,验证后定)。

---

## 阶段四:表单校验体验

- 现状:`handleSave` 空值/非法值时 `showToast` 报错,提交才知道。
- 做法:
  - Field 组件加 `error?: string` prop,错误时红描边 + 下方红字提示(小票风 `--c-burn`)。
  - AddCardForm 改为**失焦校验 + 提交兜底**:名称/总价/次数失焦时即时校验,错误行内显;提交时再统一校验一遍。
  - 保留 showToast 作为提交时的兜底(若用户没看到行内错误)。

---

## 风险与验证
- **组件库集成风险最高**:Taro + NutUI 的构建配置(小程序端 postcss、按需加载)可能踩坑。先单独验证 1a 能双端构建+运行,再推进其余。
- 每阶段:`pnpm typecheck` + `pnpm lint` + `pnpm build:h5` + `pnpm build:weapp` + H5 截图核对。
- core 不动(本次纯 app 层交互),但顺带跑 `core:test` 确认无误伤。
- reduced-motion 全程兜底。

## 阶段顺序与可中断点
1. 阶段一(组件库 + 确认/反馈)← 风险最高,先做,验证组件库可行性。
2. 阶段四(表单校验)← 独立、价值高。
3. 阶段二(加载/空态)。
4. 阶段三(微动画)← 锦上添花,最后。

每阶段独立提交,可随时暂停。

## 不做
- 不用 NutUI 替换任何现有展示组件。
- 不改单页架构、不改 core 计算。
- 删卡功能本身不在本次(空态为它预备,功能留到「我的」页)。
