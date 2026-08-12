/** 商务工作台渠道商单金额模型；表单用人民币元，后端保存人民币分。 */
import { formatCny, yuanToFen } from '../opportunities/opportunity-amount'

export function orderAmountInput(value: string): number | null {
  return yuanToFen(value)
}

export function formatOrderAmount(amountFen: number) {
  return formatCny(amountFen)
}
