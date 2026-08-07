/**
 * 业务模块统一空状态。
 * @param title 空状态标题
 * @param description 下一步引导文案
 * @param action 可选的创建或上传按钮
 */
import { ArrowUpRight, Inbox } from 'lucide-react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className='flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center'>
      <div className='relative mb-4 flex size-14 items-center justify-center rounded-lg border bg-background'>
        <Inbox className='size-6 text-muted-foreground' strokeWidth={1.5} />
        <ArrowUpRight className='absolute top-1.5 right-1.5 size-3.5 text-primary' />
      </div>
      <h3 className='text-sm font-medium'>{title}</h3>
      <p className='mt-1 max-w-md text-sm text-muted-foreground'>
        {description}
      </p>
      {action && <div className='mt-4'>{action}</div>}
    </div>
  )
}
