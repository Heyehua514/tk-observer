/** 渠道商单状态更新载荷：cancelled 必带取消原因，与 channel_orders 数据库约束一致。 */
export function orderStatusUpdatePayload(
  status: string,
  reason: string
): { status: string; cancel_reason?: string } {
  if (status === 'cancelled' && !reason.trim()) {
    throw new Error('CANCEL_REASON_REQUIRED')
  }
  return status === 'cancelled'
    ? { status, cancel_reason: reason.trim() }
    : { status }
}
