/** 渠道商单状态更新载荷自检。 */
import { describe, expect, it } from 'vitest'
import { orderStatusUpdatePayload } from './order-status-update'

describe('order status update payload', () => {
  it('requires a reason when cancelling', () => {
    expect(() => orderStatusUpdatePayload('cancelled', '  ')).toThrow(
      'CANCEL_REASON_REQUIRED'
    )
  })

  it('includes trimmed cancel reason when cancelling', () => {
    expect(orderStatusUpdatePayload('cancelled', ' 客户预算调整 ')).toEqual({
      status: 'cancelled',
      cancel_reason: '客户预算调整',
    })
  })

  it('only sends status for other transitions', () => {
    expect(orderStatusUpdatePayload('confirmed', '')).toEqual({
      status: 'confirmed',
    })
  })
})
