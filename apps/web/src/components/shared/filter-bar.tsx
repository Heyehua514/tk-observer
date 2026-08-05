/**
 * 列表页通用筛选容器。
 * @param children 站点、状态、日期或排序控件
 * @param onReset 清空全部筛选条件
 */
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FilterBar({
  children,
  onReset,
}: {
  children: React.ReactNode
  onReset?: () => void
}) {
  return (
    <div className='flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3'>
      {children}
      {onReset && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onReset}
          className='ml-auto'
        >
          <RotateCcw className='size-4' />
          重置
        </Button>
      )}
    </div>
  )
}
