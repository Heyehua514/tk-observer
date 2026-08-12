/** 市场资源库财务显示模型；金额统一按人民币分保存、人民币元展示。 */
import { formatMoney } from '@/lib/format'
import { yuanToFen } from '@/features/business/opportunities/opportunity-amount'

export function financeYuanInput(value: string): number | null {
  return yuanToFen(value)
}

export function formatFinanceCny(amountFen: number) {
  return formatMoney(amountFen, 'CNY')
}
