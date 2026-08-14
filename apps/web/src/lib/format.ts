/** 跨境业务通用的金额与时间格式化工具。金额以最小单位（分）存储，统一按人民币展示。 */
export function formatMoney(amountMinor: number, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100)
}

export function formatBeijingTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  }).format(new Date(value))
}
