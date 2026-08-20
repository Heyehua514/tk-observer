/** C2 · 协作看板/详情中展示“最近状态变更”的小组件。 */
import { Clock3 } from 'lucide-react'
import { useStatusHistory, statusLabel } from './status-history'

export function StatusHistoryChip({
  entityType,
  entityId,
  label = '协作记录',
}: {
  entityType: string
  entityId: string
  label?: string
}) {
  const { data } = useStatusHistory(entityType, entityId)
  if (!data?.length) return null
  const latest = data[0]
  return (
    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
      <Clock3 className='size-3' />
      <span>
        {label}：{statusLabel(entityType, latest.fromStatus)} →{' '}
        {statusLabel(entityType, latest.toStatus)}（{latest.actorName}）
      </span>
    </div>
  )
}
