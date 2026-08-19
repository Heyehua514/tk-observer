/**
 * 列表/面板统一错误态：中文错误提示 + 重新加载按钮。避免页面白屏或无限加载。
 */
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LoadStateError({
  title = '数据暂时无法加载',
  description = '请检查数据服务和当前账号权限后重试。',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className='flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center'>
      <p className='text-sm font-medium'>{title}</p>
      <p className='max-w-md text-sm text-muted-foreground'>{description}</p>
      {onRetry && (
        <Button variant='outline' size='sm' onClick={onRetry}>
          <RotateCw className='size-4' />
          重新加载
        </Button>
      )}
    </div>
  )
}
