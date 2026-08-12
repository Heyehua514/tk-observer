/** 市场活动财务模型；表单用人民币元，PocketBase 保存人民币分。 */
import { yuanToFen } from '@/features/business/opportunities/opportunity-amount'

export function activityFinanceAmountInput(value: string): number | null {
  return yuanToFen(value)
}
