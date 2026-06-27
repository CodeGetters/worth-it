import { useState } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { CardType } from '@worthit/core'
import type { NewCardInput } from '../../store/useCardStore'
import { Ticket, MonoCap, Field, Button } from '@/components'
import { today, addYears } from '../../utils/date'
import { t } from '../../i18n'
import './AddCardForm.scss'

/**
 * 添加卡表单（移植自 design/mobile.html 屏3「开一张新票」）。
 *
 * 自管本地表单态，校验通过后把成品 NewCardInput 交给 onSubmit（由页面调 store.addCard）。
 * 不直接碰 store/storage——表单态只在提交那一刻外抛，符合「store 只存原始数据」。
 * 录入门槛设计：能默认就默认（卡型默认不限次、有效期今天+1年），选填字段标「可先不填」。
 */
interface AddCardFormProps {
  onSubmit: (input: NewCardInput) => void
  /** 续卡预填：用上期卡信息初始化表单；不传为全新空表单 */
  prefill?: NewCardInput | null
}

export function AddCardForm({ onSubmit, prefill }: AddCardFormProps) {
  const [type, setType] = useState<CardType>(prefill?.type ?? 'unlimited')
  const [name, setName] = useState(prefill?.name ?? '')
  const [totalPrice, setTotalPrice] = useState(prefill ? String(prefill.totalPrice) : '')
  const [totalTimes, setTotalTimes] = useState(
    prefill?.totalTimes != null ? String(prefill.totalTimes) : '',
  )
  const [expectedPrice, setExpectedPrice] = useState(
    prefill?.expectedPrice != null ? String(prefill.expectedPrice) : '',
  )
  // 有效期默认今天+1年（可改）；购买日固定今天（第一版不暴露输入）
  const [expireDate, setExpireDate] = useState(() => prefill?.expireDate ?? addYears(today(), 1))

  const isLimited = type === 'limited'
  // 有效期是否仍是默认值（今天+1年），用于显示「已自动填」印章
  const isAutoExpire = expireDate === addYears(today(), 1)

  function fail(msg: string) {
    void Taro.showToast({ title: msg, icon: 'none' })
  }

  function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) return fail(t('addCard.errName'))

    const price = Number(totalPrice)
    if (!Number.isFinite(price) || price <= 0) return fail(t('addCard.errPrice'))

    let times: number | undefined
    if (isLimited) {
      times = Number(totalTimes)
      if (!Number.isFinite(times) || times <= 0) return fail(t('addCard.errTimes'))
    }

    const expected = Number(expectedPrice)
    const hasExpected = expectedPrice.trim().length > 0 && Number.isFinite(expected) && expected > 0

    const input: NewCardInput = {
      name: trimmedName,
      totalPrice: price,
      type,
      purchaseDate: today(),
      expireDate,
      ...(isLimited ? { totalTimes: times } : {}),
      ...(hasExpected ? { expectedPrice: expected } : {}),
    }
    console.log(`[worthit:addform] 提交新卡 name=${trimmedName} type=${type} price=${price}`)
    onSubmit(input)
  }

  return (
    <View className="addform">
      {/* 卡型选择：两张小票二选一，选中黄底 */}
      <View className="addform__types">
        <TypeCard
          active={isLimited}
          title={t('addCard.typeLimited')}
          hint={t('addCard.typeLimitedHint')}
          onClick={() => setType('limited')}
        />
        <TypeCard
          active={!isLimited}
          title={t('addCard.typeUnlimited')}
          hint={t('addCard.typeUnlimitedHint')}
          onClick={() => setType('unlimited')}
        />
      </View>

      <View className="addform__fields">
        <Field
          label={t('addCard.labelName')}
          value={name}
          onChange={setName}
          placeholder={t('addCard.phName')}
          optional
        />

        <View className="addform__row">
          <Field
            label={t('addCard.labelTotalPrice')}
            value={totalPrice}
            onChange={setTotalPrice}
            placeholder={t('addCard.phTotalPrice')}
            type="number"
            className="addform__col"
          />
          {isLimited && (
            <Field
              label={t('addCard.labelTotalTimes')}
              value={totalTimes}
              onChange={setTotalTimes}
              placeholder={t('addCard.phTotalTimes')}
              type="number"
              className="addform__col"
            />
          )}
        </View>

        {/* 有效期：Picker 选日期，默认今天+1年 */}
        <View className="field-group">
          <MonoCap className="field-group__label">{t('addCard.labelExpire')}</MonoCap>
          <Picker
            mode="date"
            value={expireDate}
            start={today()}
            onChange={(e) => setExpireDate(String(e.detail.value))}
          >
            <View className="addform__expire">
              <Text className="addform__expire-val">{expireDate}</Text>
              {isAutoExpire && (
                <Text className="addform__expire-auto">{t('addCard.expireAuto')}</Text>
              )}
            </View>
          </Picker>
        </View>

        <Field
          label={t('addCard.labelExpected')}
          value={expectedPrice}
          onChange={setExpectedPrice}
          placeholder={t('addCard.phExpected')}
          type="number"
          optional
        />
      </View>

      <Button variant="ink" size="large" className="addform__save" onClick={handleSave}>
        {t('addCard.save')}
      </Button>
    </View>
  )
}

/** 卡型选择卡片：选中黄底硬影、未选灰边 */
function TypeCard({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <Ticket tone={active ? 'alert' : 'normal'} flat className={`typecard ${active ? 'typecard--on' : ''}`}>
      <View className="typecard__inner" onClick={onClick}>
        <Text className="typecard__title">{title}</Text>
        <Text className="typecard__hint">{hint}</Text>
      </View>
    </Ticket>
  )
}
