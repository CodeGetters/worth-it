/**
 * 值啦核心数据模型
 *
 * 设计原则（见 TECH_PLAN.md）：
 * - store 只存原始数据，所有派生数字（单价/回本/负反馈）渲染时实时算，不入库
 * - 每条记录自带同步元信息（updatedAt/deleted/_dirty），为将来接云同步预留，建模时就带上
 */

/** 卡型：不限次年卡 / 有限次课包 */
export type CardType = 'unlimited' | 'limited'

/** 一张卡 */
export interface Card {
  id: string
  /** 卡名，如「健身年卡」 */
  name: string
  /** 总价（元） */
  totalPrice: number
  /** 卡型 */
  type: CardType
  /** 购买日（YYYY-MM-DD） */
  purchaseDate: string
  /** 有效期截止日（YYYY-MM-DD）。年卡默认购买日+1年，可改 */
  expireDate: string
  /** 总次数，仅有限次课包需要 */
  totalTimes?: number
  /** 用户心里「一次值多少钱」（元），可不填，仅作参照线 */
  expectedPrice?: number

  // —— 同步元信息（接云前也维护，切云不改调用方）——
  /** 最后修改时间戳（ms），用于冲突合并：最后写入胜出 */
  updatedAt: number
  /** 软删除标记，不真删（否则同步时被删项会被推回） */
  deleted?: boolean
  /** 本地改过但未同步 */
  _dirty?: boolean
}

/** 一条打卡记录 */
export interface CheckIn {
  id: string
  /** 所属卡 id */
  cardId: string
  /** 打卡日期（YYYY-MM-DD），支持补卡：办卡当天 ~ 今天 */
  date: string

  // —— 同步元信息 ——
  updatedAt: number
  deleted?: boolean
  _dirty?: boolean
}

/**
 * calcCard 的计算结果：四端共享的「数字事实」。
 *
 * 只承载可被纯计算得出的客观数字与标志位，不含任何人话文案、颜色、动画——
 * 那些表现层决策交给各端 UI（见 feedback.ts 的状态枚举与 README「计算边界兜底」）。
 */
export interface CalcResult {
  /** 真实单次成本 = 总价 ÷ 已打卡次数；未打卡（除零）为 null，UI 显破折号 */
  realUnitCost: number | null
  /** 已打卡次数（已过滤软删除） */
  checkInCount: number
  /** 是否已过期（today > expireDate） */
  expired: boolean
  /** 有限次课包剩余次数（总次数 − 已打卡，下限 0）；不限次为 null */
  remainingTimes: number | null
  /** 有限次课包是否已打满（已打卡 ≥ 总次数）：打满后禁止再打卡、冻结单价；不限次恒 false */
  full: boolean

  // —— 样本充分性（少样本不预测，见 README）——
  /** 样本是否充分：打卡 ≥ 3 次 且 距购买 ≥ 7 天。不足时 UI 藏住大数字、改引导 */
  enoughSample: boolean
  /** 距样本充分还差几次打卡（已达标为 0），用于「再打 N 次就能算」引导 */
  checkInsToSample: number

  // —— 断卡（负反馈输入，今天作参数传入保证纯函数）——
  /** 距最后一次打卡的天数；从未打卡为 null。0 表示今天打过 */
  breakDays: number | null
  /** 按有效期均摊的日成本 = 总价 ÷ 有效期总天数（向上取整，下限 1） */
  dailyBurn: number
  /** 断卡期间「白扔」的钱 = dailyBurn × breakDays；未断卡或从未打卡为 0 */
  wastedByBreak: number

  // —— 心里价参照里程碑（expectedPrice 未填时全为 null/false）——
  /** 单价是否已降到心里价及以下（已比心里价划算） */
  belowExpected: boolean
  /** 还需再打几次，单价才低于心里价（已达标为 0）；无心里价或除零为 null */
  checkInsToExpected: number | null

  // —— 到期复盘结算（用于复盘屏；未过期时仍可作实时预估）——
  /** 相对心里价省下的钱 = (心里价 − 真实单价) × 已打卡次数；无心里价或未打卡为 null */
  savedVsExpected: number | null
  /** 有限次课包到期未用完浪费的钱 = 未用次数 ÷ 总次数 × 总价；不限次或无浪费为 0 */
  wastedUnused: number
}

/** 卡的整体状态：在用（绿）/ 在亏（红）/ 待复盘（灰），用于总览着色 */
export type CardStatus = 'active' | 'burning' | 'review'

/**
 * 断卡负反馈档位（随断卡天数递进，见 README / TODO）：
 * - none   未断卡（今天/近 2 天内打过）
 * - mild   温和 3-6 天
 * - number 给数字 7-14 天
 * - harsh  扎心算日烧钱 15-20 天
 * - stop   止损 21 天+（切「接受沉没成本、下次别续」语气）
 */
export type BreakLevel = 'none' | 'mild' | 'number' | 'harsh' | 'stop'

/** 转折点：跨过某条线的瞬间，UI 据此弹庆祝/提示（由「打卡前后两个 CalcResult」对比得出）。
 *  welcomeBack：断卡状态下重新打卡（回归），优先级最高。 */
export type TurningPoint =
  | 'none'
  | 'welcomeBack'
  | 'becameGoodDeal'
  | 'bigDrop'
  | 'fullPaid'

/**
 * 到期复盘结论（指导下次决策，见 README 功能5 / TODO 防陷阱 C）：
 * - worthIt   这卡用得很值（最终单价低于心里价，或频率足够高）
 * - soso      还算划算（中间档）
 * - notWorth  用得太少（单价远超心里价、或大量次数没用完浪费）→ 下次别办这么大的
 * UI 按此枚举映射「结算总票」标题与「下次怎么选」建议文案，core 不产文案。
 */
export type ReviewVerdict = 'worthIt' | 'soso' | 'notWorth'

/**
 * feedback 的反馈结果：离散状态枚举，不含文案。
 * UI 拿这些枚举去映射各端文案、颜色、动画（文案可分端微调，判定四端一致）。
 */
export interface FeedbackResult {
  /** 整体状态（总览着色） */
  status: CardStatus
  /** 断卡负反馈档位 */
  breakLevel: BreakLevel
}
