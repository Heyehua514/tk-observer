/** 设计任务四列看板：支持新建与拖拽状态流转。 */
import { useState } from 'react'
import { regions, type Region } from '@/types/commerce'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateDesignTask,
  useDesignTasks,
  useUpdateDesignTask,
} from '@/features/design/tasks/use-design-tasks'
import { AiAssistantPanel, TaskAiEntry } from '@/features/shared-ai'
import { buildTaskAnalysisRequest } from '@/features/shared-ai/ai-context'
import { designTaskStatuses, type DesignTaskStatus } from './types'

const labels: Record<DesignTaskStatus, string> = {
  todo: '待设计',
  doing: '进行中',
  review: '待审核',
  done: '已完成',
}

export function DesignTasksBoard() {
  const tasks = useDesignTasks()
  const create = useCreateDesignTask()
  const update = useUpdateDesignTask()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [region, setRegion] = useState<Region>('US')
  const [dragging, setDragging] = useState('')
  const [analysisPrompt, setAnalysisPrompt] = useState('')
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Plus className='size-4' />
          新增任务
        </Button>
      </div>
      <div className='grid min-w-[760px] grid-cols-4 gap-3 overflow-x-auto'>
        {designTaskStatuses.map((status) => (
          <section
            key={status}
            className='min-h-72 rounded-lg border bg-muted/30 p-3'
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData('text/plain')
              if (id) update.mutate({ id, status })
            }}
          >
            <div className='mb-3 flex items-center justify-between text-sm font-medium'>
              <span>{labels[status]}</span>
              <Badge variant='secondary'>
                {tasks.data?.filter((item) => item.status === status).length ||
                  0}
              </Badge>
            </div>
            <div className='space-y-2'>
              {tasks.data
                ?.filter((item) => item.status === status)
                .map((task) => (
                  <motion.article
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      const nativeEvent = event as unknown as DragEvent
                      nativeEvent.dataTransfer?.setData('text/plain', task.id)
                      setDragging(task.id)
                    }}
                    onDragEnd={() => setDragging('')}
                    animate={
                      dragging === task.id && !reduceMotion
                        ? {
                            scale: 1.02,
                            boxShadow: '0 12px 24px rgba(15,23,42,.16)',
                          }
                        : {
                            scale: 1,
                            boxShadow: '0 1px 2px rgba(15,23,42,.06)',
                          }
                    }
                    className='cursor-grab rounded-md border bg-background p-3'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='text-sm font-medium'>{task.title}</div>
                      <TaskAiEntry
                        task={{
                          title: task.title,
                          status: task.status,
                          dueAt: task.dueAt,
                          notes: `设计站点：${task.region}`,
                          source: 'design_tasks',
                        }}
                        onSelect={(selectedTask) =>
                          setAnalysisPrompt(
                            buildTaskAnalysisRequest(selectedTask)
                          )
                        }
                      />
                    </div>
                    <div className='mt-2 flex justify-between text-xs text-muted-foreground'>
                      <span>{task.region}</span>
                      <span>
                        {task.dueAt ? task.dueAt.slice(0, 10) : '未设截止日'}
                      </span>
                    </div>
                  </motion.article>
                ))}
            </div>
          </section>
        ))}
      </div>
      {analysisPrompt && (
        <AiAssistantPanel scope='设计工作台' initialPrompt={analysisPrompt} />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增设计任务</DialogTitle>
          </DialogHeader>
          <form
            className='space-y-4'
            onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              create.mutate(
                {
                  title: String(form.get('title') || ''),
                  dueAt: String(form.get('dueAt') || ''),
                  region,
                },
                { onSuccess: () => setOpen(false) }
              )
            }}
          >
            <Field label='任务名称'>
              <Input name='title' required />
            </Field>
            <Field label='截止日期'>
              <Input name='dueAt' type='date' />
            </Field>
            <Field label='站点'>
              <Select
                value={region}
                onValueChange={(value) => setRegion(value as Region)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((item) => (
                    <SelectItem value={item} key={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button type='submit' disabled={create.isPending}>
              保存任务
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
