/**
 * 数据表格统一加载骨架屏。替代列表页加载时闪现"暂无数据/正在加载…"。
 */
import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({
  rows = 4,
  columns = 5,
  title,
}: {
  rows?: number
  columns?: number
  title?: string
}) {
  return (
    <div
      className='space-y-3'
      aria-label={title || '正在加载数据'}
      role='status'
    >
      <div className='flex items-end gap-3'>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className='h-4 w-full max-w-[120px]' />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className='flex items-center gap-3'>
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} className='h-10 w-full' />
          ))}
        </div>
      ))}
    </div>
  )
}
