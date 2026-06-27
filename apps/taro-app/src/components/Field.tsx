import { View, Input } from '@tarojs/components'
import type { ReactNode } from 'react'
import { MonoCap } from './MonoCap'
import './Field.scss'

/** 输入类型：文本 / 数字（数字走 Taro digit 键盘） */
export type FieldType = 'text' | 'number'

interface FieldProps {
  /** 字段名（mono-cap 小标题） */
  label: string
  /** 当前值（受控，统一用 string，数字由调用方解析） */
  value: string
  /** 值变化回调 */
  onChange: (value: string) => void
  placeholder?: string
  type?: FieldType
  /**
   * 选填字段：未填时框用虚线灰 + 占位 faint（对齐原型「待填用虚线灰框」）。
   * 必填字段恒用墨黑硬描边。
   */
  optional?: boolean
  /** 右侧附加节点（如有效期的「已自动填」印章） */
  suffix?: ReactNode
  className?: string
}

/**
 * 表单输入控件（移植自 design/mobile.html 屏3 录入字段）。
 *
 * 组件库唯一的输入控件，基于 Taro Input 受控封装：四端通用、无障碍。
 * 视觉「清醒小票」：已填墨黑硬描边、选填未填虚线灰框，一眼看出录入进度。色彩走 var(--c-*)。
 */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  optional,
  suffix,
  className = '',
}: FieldProps) {
  const filled = value.trim().length > 0
  // 选填且未填 → 虚线灰框；其余（必填，或选填已填）→ 墨黑实框
  const dashed = optional && !filled
  const cls = ['field', dashed && 'field--dashed', type === 'number' && 'field--num', className]
    .filter(Boolean)
    .join(' ')

  return (
    <View className="field-group">
      <MonoCap className="field-group__label">{label}</MonoCap>
      <View className={cls}>
        <Input
          className="field__input"
          value={value}
          type={type === 'number' ? 'digit' : 'text'}
          placeholder={placeholder}
          placeholderClass="field__ph"
          onInput={(e) => onChange(e.detail.value)}
        />
        {suffix}
      </View>
    </View>
  )
}
