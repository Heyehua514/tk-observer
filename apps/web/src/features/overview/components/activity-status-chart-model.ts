/** 总览活动阶段分布图：按市场既定状态顺序聚合活动。 */
import { eventStatusLabels, eventStatuses } from '@/features/market/constants'
import type { EventStatus } from '@/features/market/types'

export function buildActivityStatusChart<T extends { status: string }>(
  events: readonly T[]
) {
  return eventStatuses.flatMap((status) => {
    const count = events.filter((event) => event.status === status).length
    return count
      ? [{ status: eventStatusLabels[status as EventStatus], count }]
      : []
  })
}
