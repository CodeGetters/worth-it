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
    currency: '¥',
    perTime: '/ 次',
    countGone: '已去 {count} 次',
    // 按钮
    btnCheckIn: '今天去了，打卡',
    btnUndo: '撤销上一次',
    btnFull: '已用完',
    backfill: '补打过去的卡 ›',
    // delta（这次比上次便宜了多少）
    deltaCheaper: '这次比上次便宜 ¥{diff}',
    deltaTryFirst: '去一次试试，看单价怎么掉',
    // hint（跟心里价比）
    hintBelow: '已低于你心里价 ¥{worth}/次 · 去越多越省',
    hintAbove: '比你心里价 ¥{worth}/次 还贵 ¥{over} · 不限次，继续去会更便宜',
    hintNoWorth: '不限次卡，去越多越便宜',
    // 进度参照
    togoBelow: '已比心里价划算',
    togoNeed: '再去 {n} 次就低于心里价',
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
  },
} as const
