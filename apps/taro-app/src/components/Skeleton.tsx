import { View } from '@tarojs/components'
import { Ticket } from './Ticket'
import './Skeleton.scss'

/**
 * 打卡屏加载骨架（小票形占位）。
 *
 * 卡数据就绪前显示票面轮廓 + 灰条占位（呼吸微动画），替代「只显 app 名」的空等待，
 * 让加载有结构感、减少跳变。纯 CSS，reduced-motion 兜底。
 */
export function Skeleton() {
  return (
    <View className="skeleton">
      <Ticket toothed className="skeleton__ticket">
        {/* 头部：卡名条 + 次数条 */}
        <View className="skeleton__head">
          <View className="skeleton__bar skeleton__bar--name" />
          <View className="skeleton__bar skeleton__bar--count" />
        </View>
        {/* 大单价区：标签条 + 巨数字块 */}
        <View className="skeleton__price">
          <View className="skeleton__bar skeleton__bar--label" />
          <View className="skeleton__bar skeleton__bar--mega" />
        </View>
        {/* 操作区：大按钮块 */}
        <View className="skeleton__bar skeleton__bar--btn" />
      </Ticket>
    </View>
  )
}
