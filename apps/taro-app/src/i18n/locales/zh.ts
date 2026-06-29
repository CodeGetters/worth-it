/**
 * 中文字典（默认语言）。
 *
 * key 结构刻意覆盖 core 的枚举（feedback.* 下的 break/status/turn），
 * 这是「core 不吐文案、UI 按枚举映射」契约的兑现点——出海时复制此文件译成
 * 当地语言即可，core 与组件零改动。
 *
 * 含 {placeholder} 的文案由 t() 第二参数填充。
 */
export const zh = {
  app: {
    name: '值啦',
    slogan: '又去了一次，值啦。',
  },

  // 通用：跨页复用的按钮/动作文案
  common: {
    cancel: '取消',
    confirm: '确定',
  },

  // 顶栏 / 底部导航 / 通用
  nav: {
    myCards: '我的卡',
    tabCheckin: '打卡',
    tabOverview: '总览',
    tabMe: '我的',
    comingSoon: '即将推出',
    addCard: '添加',
    help: '帮助',
  },

  checkin: {
    // 大单价区
    priceLabelNormal: '你每去一次，这一次实际花了',
    priceLabelBreak: '你没去的这段时间，单价一直卡在',
    priceLabelExpired: '这张卡已到期，最终单价冻结在',
    currency: '¥',
    perTime: '/ 次',
    countGone: '已去 {count} 次',
    // 按钮
    btnCheckIn: '今天去了，打卡',
    btnUndo: '撤销上一次',
    undoConfirmTitle: '撤销上一次打卡?',
    undoConfirmMsg: '会把最近一次打卡记录删掉，单价随之回升。',
    undoConfirmOk: '撤销',
    btnFull: '已用完',
    btnExpired: '已过期 · 看复盘',
    backfill: '补打过去的卡 ›',
    // delta（这次比上次便宜了多少）
    deltaCheaper: '这次比上次便宜 ¥{diff}',
    deltaTryFirst: '去一次试试，看单价怎么掉',
    // hint（跟心里价比）
    hintBelow: '已低于你心里价 ¥{worth}/次 · 去越多越省',
    hintAbove: '比你心里价 ¥{worth}/次 还贵 ¥{over} · 不限次，继续去会更便宜',
    hintNoWorth: '不限次卡，去越多越便宜',
    // hint（过期态：给结论，不再引导继续去）
    hintExpiredBelow: '最终单价 ¥{worth}/次 以内 · 这卡你用值了',
    hintExpiredAbove: '最终比心里价 ¥{worth}/次 还贵 ¥{over} · 下次可换更小的卡',
    hintExpiredNoWorth: '已到期 · 最终单价已冻结',
    // 进度参照
    togoBelow: '已比心里价划算',
    togoNeed: '再去 {n} 次就低于心里价',
    togoExpiredBelow: '最终低于心里价',
    togoExpiredAbove: '到期仍高于心里价',
    compareWorth: '对比你心里价 ¥{worth}',
    // 少样本
    fewSampleTitle: '再打 {n} 次，就能算出你的真实单价',
    fewSampleDesc: '刚办卡的前几次，数据太少算出来会乱跳。先稳定打几次，我们再给你看真实成本。',
    fewSamplePlaceholder: '¥ ? ? ?',
    // 过期
    expiredFrozen: '已过期 · 冻结 ¥{price}/次',
    // 空状态 / 示例卡
    demoCardName: '健身年卡',
  },

  // 总览页（屏 7）：汇总票 + 卡列表
  overview: {
    // 汇总票
    summaryCap: '至今汇总 / TOTAL',
    savedTotal: '比单次买总共省下',
    lostTotal: '这些卡目前总共在亏',
    evenTotal: '填上心里价，就能看总共省了多少',
    pendingTotal: '再打几次，就能看总共省了多少',
    countActive: '在用',
    countBurning: '在亏',
    countReview: '已结束',
    // 卡列表
    listCap: '我的卡 · {count} · 点任一张进去打卡',
    // 行摘要
    rowUnit: '已去 {count} 次 · ¥{price}/次',
    rowLimited: '用 {used}/{total} · ¥{price}/{unit}',
    rowFewSample: '已去 {count} 次 · 再打几次算单价',
    rowNoCheckIn: '还没打卡 · 去一次看单价',
    unitTime: '次',
    unitClass: '节',
    // 状态印章
    stampSave: '越用越省',
    stampActive: '在用',
    stampBurn: '在亏钱',
    stampReview: '待复盘',
  },

  // 添加卡表单（屏 3）：开一张新票
  addCard: {
    title: '开一张新票',
    // 卡型选择
    typeLimited: '有限次课包',
    typeLimitedHint: '如 40 节私教',
    typeUnlimited: '不限次年卡',
    typeUnlimitedHint: '如健身年卡',
    // 字段 label
    labelName: '套餐名称',
    labelTotalPrice: '总价(元)',
    labelTotalTimes: '总次数',
    labelExpire: '有效期',
    labelExpected: '你心里一次值多少钱?(可先不填)',
    // placeholder
    phName: '例:XX 健身私教 40 节',
    phTotalPrice: '如 9800',
    phTotalTimes: '如 40',
    phExpected: '作参照基准，后面随时改',
    // 有效期
    expireAuto: '已自动填:今天+1年',
    expireYears: '{n} 年',
    expireMonths: '{n} 个月',
    expireDays: '{n} 天',
    // 保存
    save: '保存，开始打卡',
    // 校验提示
    errName: '给这张卡起个名字吧',
    errPrice: '填一下总价(大于 0)',
    errTimes: '有限次课包要填总次数(大于 0)',
  },

  // 到期复盘（屏 6）：结算总票 + 下次怎么选
  review: {
    title: '到期复盘',
    finalReceipt: 'FINAL RECEIPT · 结算总票',
    // 三档结论标题（ReviewVerdict: worthIt/soso/notWorth）
    titleWorth: '这张卡，你用得很值',
    titleSoso: '这张卡，还算划算',
    titleNotWorth: '这张卡，用得有点少',
    // 副标：{name} · 共去 {count} 次
    subtitle: '{name} · 共去 {count} 次',
    // 账目行
    finalUnit: '最终每次只花',
    yourWorth: '你心里价',
    savedVs: '比单次买省下',
    lostVs: '比单次买多花',
    wastedUnused: '没用完浪费',
    perTime: '/ 次',
    // 下次怎么选
    nextTitle: '下次怎么选',
    adviceWorth: '你这频率，这卡办得值。下次放心续。',
    adviceSoso: '用得还行。下次按这个频率，续不续都不亏。',
    adviceNotWorth: '这卡用得太少，下次别办这么大的，换更小的包更省。',
    // 操作
    renew: '续这张卡 · 开新周期',
    exportData: '导出这张卡的数据 ›',
  },

  // —— core 枚举映射 ——
  feedback: {
    break: {
      // BreakLevel: none/mild/number/harsh/stop
      mild: '好几天没见啦，今天动一动？',
      number: '停了一周，单价卡在 ¥{price} 降不下来。',
      harsh: '断卡 {days} 天 · 白扔 ¥{wasted} 会籍钱。',
      stop: '也许这卡本就不适合你。接受沉没成本，下次别续更省。',
    },
    turn: {
      // TurningPoint: becameGoodDeal/bigDrop/fullPaid
      becameGoodDeal: '划算了！每次 ¥{price}，已低于你心里价。',
      bigDrop: '↓ ¥{diff} · 这一次，单价掉了一大截',
      fullPaid: '这张卡打满了，最终每次 ¥{price}',
      welcomeBack: '欢迎回来 · 继续去，把单价打下去',
    },
    // 里程碑 Toast：大字 big + 小字 small 两段（移植自原型 showToast）
    toast: {
      welcomeBackBig: '欢迎回来 👊',
      welcomeBackSmall: '继续去，把单价打下去',
      goodDealBig: '划算了！',
      goodDealSmall: '每次 ¥{price}，已低于你心里价',
      bigDropBig: '↓ ¥{diff}',
      bigDropSmall: '这一次，单价掉了一大截',
      fullPaidBig: '打满了！',
      fullPaidSmall: '最终每次 ¥{price}，到期看复盘',
    },
  },
} as const
