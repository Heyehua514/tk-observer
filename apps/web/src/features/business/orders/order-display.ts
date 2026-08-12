/** 商务渠道商单展示模型；权限：business、boss，只处理前端显示口径。 */
import { formatOrderAmount } from './order-amount'
import {
  orderContentTypeLabels,
  orderPlatformLabels,
  orderStatusLabels,
} from './order-options'

export type OrderDisplayRow = {
  amount: number
  status: string
  platform: string
  contentType: string
  publishDate: string
}

export function orderStatusLabel(status: string) {
  return orderStatusLabels[status] || status || '—'
}

export function orderPlatformLabel(platform: string) {
  return orderPlatformLabels[platform] || platform || '—'
}

export function orderContentTypeLabel(contentType: string) {
  return orderContentTypeLabels[contentType] || contentType || '—'
}

export function orderPublishDateLabel(value: string) {
  return value ? value.slice(0, 10) : '—'
}

export function buildOrderDisplay(row: OrderDisplayRow) {
  return {
    amount: formatOrderAmount(row.amount),
    status: orderStatusLabel(row.status),
    platform: orderPlatformLabel(row.platform),
    contentType: orderContentTypeLabel(row.contentType),
    publishDate: orderPublishDateLabel(row.publishDate),
  }
}
