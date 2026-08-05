/** 路由级错误边界，单页异常时提供恢复入口，不拖垮应用壳。 */
import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RouteError({ reset }: ErrorComponentProps) {
  return (
    <div className='flex min-h-[420px] flex-col items-center justify-center text-center'>
      <AlertTriangle className='mb-4 size-8 text-destructive' />
      <h1 className='text-lg font-semibold'>当前页面暂时无法显示</h1>
      <p className='mt-2 text-sm text-muted-foreground'>
        其他工作台不受影响，请重试或切换页面。
      </p>
      <Button className='mt-6' variant='outline' onClick={reset}>
        <RefreshCcw className='size-4' />
        重新加载此页面
      </Button>
    </div>
  )
}
