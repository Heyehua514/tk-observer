/**
 * 业务模块统一空状态。
 * @param title 空状态标题
 * @param description 下一步引导文案
 * @param action 可选的创建或上传按钮
 */
import { Inbox } from 'lucide-react'

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
      <div className='mb-4 flex size-12 items-center justify-center rounded-lg bg-muted'>
        <Inbox className='size-5 text-muted-foreground' />
      </div>
      <h3 className='text-sm font-medium'>{title}</h3>
      <p className='mt-1 max-w-md text-sm text-muted-foreground'>
        {description}
      </p>
      {action && <div className='mt-4'>{action}</div>}
    </div>
  )
}
