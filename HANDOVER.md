# Worth It · 值不值 — 交接文档

> **值啦 WORTHIT**——买后打卡工具：卡办了之后，每次去用就来打卡，看着真实单次成本一次次往下掉；断卡会挨催，多卡有总览，到期有复盘。
> 线上地址（Next.js 工程）：<https://worthit-next-codegetters.vercel.app/> · 单文件兜底版：<https://worth-it-app-codegetters.vercel.app/> · 源码：<https://github.com/CodeGetters/worth-it>
> 结构：**打卡灵魂屏（核心）+ 多卡总览 + 添加卡 + 买前算一笔（子页）**；视觉为深潜 dive / 冶炼 forge 双主题（导航右上分段切换，localStorage 记忆）。

---

## 〇、Next.js 工程（worthit-next/，当前主力版本）

单文件版之外的完整工程化实现，功能与单文件版完全对齐：

| 项 | 说明 |
|---|---|
| 技术栈 | Next.js 16（App Router）+ React 19 + TypeScript + zustand（persist 持久化） |
| 路由 | /soul 打卡灵魂屏 · /overview 总览 · /add 添加卡 · /calc 买前算一笔 · / 重定向 |
| 目录 | `lib/engine.ts`（纯函数引擎，可单测）· `lib/store.ts`（zustand store）· `components/`（NavBar/Foot/Toast/Dialog）· `app/`（四页 + themes.css + globals.css） |
| 双主题 | `[data-theme]` CSS 变量作用域 + zustand persist 记忆 + head 内联脚本防闪烁 |
| 测试 | `__tests__/engine.test.ts`（28 断言，`npx tsx __tests__/engine.test.ts`）· `.e2e/e2e.js`（本地 19 断言）· `.e2e/prod-e2e.js`（线上 8 断言） |

**本地运行**：
```bash
cd worthit-next
npm install
npm run dev        # 开发 http://localhost:3000
npm run build && npm run start   # 生产
```

**部署**：已部署 Vercel 项目 `worthit-next`，固定域名 <https://worthit-next-codegetters.vercel.app/>；部署保护（SSO）已关闭。回滚方式与主应用一致：`vercel ls worthit-next` 取历史部署，`vercel alias <url> worthit-next-codegetters.vercel.app` 秒切。

**验收记录**：引擎单测 28/28 · 本地 E2E 19/19（打卡闭环/里程碑翻转/特效/双主题/添加课包/总览/持久化/买前计算/异常输入/移动端）· 线上 E2E 8/8 · `npm run build` 通过（5 路由静态化）。详见 TESTING.md。

---

## 一、运行方式

**零依赖运行**：应用是单文件自包含网页（`app/index.html`，约 64KB），无需安装任何依赖。

| 方式 | 操作 |
|---|---|
| 本地打开 | 直接双击 `app/index.html`，浏览器打开即用 |
| 本地起服务 | `cd app && python3 -m http.server 8080`，访问 <http://localhost:8080> |
| 线上访问 | 打开 <https://worth-it-app-codegetters.vercel.app/> |

唯一外部资源是 Google Fonts（Noto Serif SC / Noto Sans SC），加载失败时自动回退系统字体（宋体/苹方），功能不受影响。

## 二、构建与部署

无构建步骤。更新应用后重新部署：

```bash
# Vercel（当前生产通道）
vercel deploy <目录> --prod --yes
# 固定域名
vercel alias <deployment-url> worth-it-app-codegetters.vercel.app
```

关键配置：
- Vercel 项目 `worth-it-app` 的 **Deployment Protection（SSO）已关闭**，公网可直接访问。若重新部署后打开跳 `vercel.com/login`，到 Project Settings → Deployment Protection 关闭即可。
- GitHub Pages 已开通但**不可用**：该账号的 GitHub Actions 被平台禁用（API 返回 422），legacy 构建永远排队。`.github/workflows/pages.yml` 已备好，Actions 恢复后 push 即自动生效。
- Cloudflare Workers `worth-it-app.branch-racer-691.workers.dev` 为临时账号部署（52 分钟内可认领），`*.workers.dev` 在中国大陆被 DNS 污染，仅作海外备用通道。

## 三、核心口径（打卡模型）

**真实单价 = 卡总价 ÷ 已打卡次数**——每打一次，分母 +1，单价往下掉一格，这是产品的灵魂数字。

- **不限次卡**：无终点，去越多越便宜；用户自填的「心里一次值多少」只是参照线（仪表 0–100%），不是回本终点
- **有限次课包**：打满总次数后打卡按钮冻结（单价定格）；到期未用次数按比例折算浪费金额，在总览提示
- **断卡负反馈**（随距上次打卡天数递进）：3–6 天温和提醒 → 7–14 天报数字（单价卡在哪）→ 15–20 天扎心（白付约 ¥X）→ 21 天+ 止损劝退（接受沉没成本、下次别续）
- **补卡**：限购买日 ~ 今天，一天可多次；单条可撤销（undo 最近一次）
- **边界**：0 次打卡显示「–」不显示天价；已过期冻结打卡并停预测

## 三·B、买前计算器口径（「买前算一笔」子页，口径与上一版一致）

**输入**：价格 P（必填 >0）、每周使用频率 F（0.1–21）、使用年限 Y（0.25–10）、单次心理价位 T（默认 ¥30）、年维护 M（选填默认 0）、残值抵扣 R（选填默认 0 ≤ P）。

**公式**：
```
预计总次数 N = F × 52 × Y
净投入  C0 = P + M×Y − R
单次成本  C = C0 ÷ N
回本次数  K = P ÷ T
年化 = C0 ÷ Y    月均 = 年化 ÷ 12
评分 = round(0.6×成本分 + 0.25×频率分 + 0.15×规模分)
  成本分：C ≤ 0.5T 记 100，C ≥ 1.5T 记 0，中间线性
  频率分：F ≥ 3 记 100，F = 0.1 记 0，中间线性
  规模分：N ≥ 150 记 100，N ≤ 10 记 0，中间线性
```

**结论级联**（按序判定）：
1. 输入不合法 → 阻止计算，不写台账
2. K > N（预期内回不了本）→ 不建议
3. 评分 < 40 或 C > 1.1T → 不建议
4. （C ≤ 0.7T 且评分 ≥ 60）或（评分 ≥ 75 且 C ≤ T）→ 值得买
5. 其余 → 边际情况

## 四、样例验证记录（3 组手工核对）

| 场景 | 输入 | 手工计算 | 系统输出 | 结论 |
|---|---|---|---|---|
| 咖啡机（值得买） | ¥1,200，5 次/周，3 年，T=30 | N=5×52×3=780；C=1200÷780≈**1.54**；K=1200÷30=**40**；年化=400；评分 0.6×100+0.25×100+0.15×100=**100** | ¥1.54 / 780 次 / 40 次 / ¥400 / 100 | 值得买 ✅ |
| 健身年卡（边际） | ¥3,000，2 次/周，1 年，T=30 | N=104；C=3000÷104≈**28.85**；K=100；sCost=53.85，sFreq=65.52，sScale=67.14 → 评分 round(58.76)=**59** | ¥28.85 / 104 次 / 100 次 / 59 | 边际情况 ✅ |
| 单反相机（不建议） | ¥15,000，0.5 次/周，5 年，T=30 | N=130；C≈**115.38**；K=500＞130 → 触发规则 2 | ¥115.38 / 130 次 / 500 次 | 不建议 ✅ |

另有边界用例 26 项（空值/负数/0/非数字/科学计数法/超大数值/频率年限越界/残值>价格/千分位与空格容错/维护残值进净投入），全部通过，详见 `TESTING.md` 与脚本 `app` 内嵌引擎的测试输出。

## 五、技术选型理由与目录结构

| 决策 | 理由 |
|---|---|
| 双主题（深潜/冶炼）CSS 变量切换 | 主题 = `[data-theme]` 作用域下的变量组（背景插画/强调色/巨数字重），切换零重排；背景插画压缩后 ≤333KB，从 `app/assets/` 加载 |
| 单文件自包含 HTML/CSS/JS | 决策工具逻辑简单、无后端需求；零构建、零依赖，任何人都能直接打开和维护；部署到任何静态托管都成立 |
| 原生 JS（无框架） | 三个视图 + 一个表单的状态量，框架收益为零；避开构建链后可维护性更高 |
| localStorage 持久化 | 单用户本地工具，无需账号与服务器；`worthit.records.v1` 键 + JSON 数组，导出/导入做数据安全网 |
| Google Fonts + 系统回退 | 中文衬线标题（Noto Serif SC）贴合 Takram 气质；断网时回退宋体/苹方不阻塞 |

```
worth-it/
├── app/index.html          ← 应用本体（打卡版：灵魂屏+总览+添加+买前算一笔）
├── app/assets/             ← 双主题背景插画（bg-dive.jpg / bg-forge.jpg）
├── index.html              ← 根入口（302 → app/index.html）
├── README.md / TECH_PLAN.md / TODO.md   ← 产品与技术方案（打卡模型的完整论证）
├── HANDOVER.md             ← 本文档
├── TESTING.md              ← 测试与验收记录
└── .github/workflows/pages.yml ← Pages 工作流（Actions 解禁后生效）
```

计算引擎（`calcCard` / `parseNumber`）是纯函数，位于 `app/index.html` 主 `<script>` 开头，与 UI 完全分离，可抽出单测（本轮 13 项断言即基于此）。

## 六、已知限制

1. **数据仅存本机浏览器**：清浏览器数据/换设备/无痕模式会丢台账。已有导出 JSON + 导入恢复兜底；云同步在 `TECH_PLAN.md` 的 storage 适配层预留了位置。
2. **频率模型是理想化假设**：按「每周 F 次 × 年限」线性外推，不考虑季节性使用波动；结果解释为「按你的预期」。
3. **心理价 T 主观**：默认 ¥30 是参考值，结论对 T 敏感（这正是口径页公开它的原因）。
4. **显示精度**：金额四舍五入 2 位小数、次数取整显示，计算始终用精确值。
5. **无自动云备份**：依赖用户主动导出。

## 七、风险与回滚方案

| 风险 | 影响 | 恢复/回滚 |
|---|---|---|
| 部署故障（线上不可访问） | 用户无法打开 | Vercel 后台或 `vercel ls` 选上一个 Ready 部署，`vercel alias <旧url> worth-it-app-codegetters.vercel.app` 即时切回；历史部署均保留 |
| 应用更新引入 bug | 计算错误/白屏 | 源码即单文件，`git revert` 后重新 `vercel deploy --prod`；或直接用上一版部署 URL 做别名回切 |
| 用户数据丢失（清缓存/换机） | 台账清零 | 常规路径：台账页「导出 JSON」定期留底；恢复路径：台账页「导入 JSON」→ 选择备份 → 自动去重合并（按记录 id）。**已实测演练：导出→清空→导入→刷新，2/2 条记录完整恢复** |
| 计算口径争议 | 结论被质疑 | 口径全部在应用内「口径说明」页公示且与代码注释一致；改口径 = 改 `calc()` + 同步更新口径页文案 |
| 访问通道失效 | 域名不可用 | 备用通道 1：Cloudflare Workers（海外）；备用通道 2：GitHub Pages（Actions 解禁后）；本地 file:// 打开始终可用 |

**回滚演练留档**：本次交付实际执行过两层演练——①数据层：清空后通过导入功能 100% 恢复（E2E 断言 7/7 通过）；②部署层：Vercel 保留全部历史部署，alias 切换为原子操作，秒级回滚。

## 八、接手者 5 分钟上手

1. 打开 `app/index.html` 确认能跑；
2. 读本文档第三节了解口径（应用内也有同款页面）；
3. 改计算逻辑 → 编辑 `app/index.html` 的 `calc()`，同步改「口径说明」区文案；
4. 改视觉 → 两套主题 token 在 `[data-theme="dive"]` / `[data-theme="forge"]` 变量区；三档结论色在 `:root`（--worth/--marginal/--skip，两主题共用）；背景插画在 `app/assets/`；
5. 部署 → `vercel deploy app --prod --yes` + `vercel alias` 固定域名。
