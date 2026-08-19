/** AI 分析授权确认弹窗：点分析前询问是否继续（消耗本机 WorkBuddy 额度）。 */
import { LoaderCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function WorkbuddyConsentDialog({
  open,
  request,
  onOpenChange,
}: {
  open: boolean
  request: { count: number } | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='size-4 text-primary' />
            调用 AI 分析
          </DialogTitle>
          <DialogDescription>
            将通过你本机的 WorkBuddy 分析 {request?.count ?? 0} 条视频，会消耗你的
            WorkBuddy 额度。确认继续吗？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => onOpenChange(true)}>
            <LoaderCircle className='size-4' />
            确认分析
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
