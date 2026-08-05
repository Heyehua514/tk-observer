/** 跨境业务通用的金额与时间格式化工具。 */
export function formatMoney(amountMinor: number, currency = 'USD') {
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
