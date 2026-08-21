import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AiTaskContext } from './ai-context'

/** 任务卡的只读 AI 入口；点击只把上下文交给父级，不修改任务。 */
export function TaskAiEntry({
  task,
  onSelect,
}: {
  task: AiTaskContext
  onSelect: (task: AiTaskContext) => void
}) {
  return (
    <Button
      size='icon'
      variant='ghost'
      aria-label={`分析任务：${task.title}`}
      onClick={() => onSelect(task)}
    >
      <Sparkles className='size-4' />
    </Button>
  )
}
