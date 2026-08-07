/** 商务工作台稳定枚举及界面映射。 */
import type { CompanyKind, CooperationStatus } from './types'

export { regions } from '@/types/commerce'
export const cooperationStatuses: CooperationStatus[] = [
  'pending',
  'contacting',
  'signed',
  'terminated',
]
export const cooperationStatusLabels: Record<CooperationStatus, string> = {
  pending: '待接触',
  contacting: '沟通中',
  signed: '已签约',
  terminated: '已终止',
}
export const companyKinds: CompanyKind[] = ['client', 'supplier']
export const companyKindLabels: Record<CompanyKind, string> = {
  client: '客户',
  supplier: '供应商',
}
