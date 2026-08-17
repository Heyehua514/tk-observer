/**
 * 剪辑工作台 - 发布排期列表：标题、账号、平台·站点、发布时间、状态流转与删除。
 * 路由：/editing production 区；权限：editing, boss。
 */
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDeletePublishSchedule } from '../hooks/use-delete-publish-schedule'
import { useUpdatePublishSchedule } from '../hooks/use-update-publish-schedule'
import type { PublishScheduleStatus } from '../types'
import {
  publishScheduleStatusLabels as statusLabels,
  type PublishScheduleItem,
} from './production-model'

const statusValues: PublishScheduleStatus[] = [
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled',
]

export function PublishScheduleTable({
  items,
}: {
  items: PublishScheduleItem[]
}) {
  const updateSchedule = useUpdatePublishSchedule()
  const deleteSchedule = useDeletePublishSchedule()
  const [deleting, setDeleting] = useState<string | null>(null)

  const changeStatus = (id: string, status: PublishScheduleStatus) => {
    void updateSchedule.mutateAsync({ id, input: { status } })
  }

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`确认删除「${title}」的发布排期？`)) return
    setDeleting(id)
    try {
      await deleteSchedule.mutateAsync(id)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/50 text-xs tracking-wider text-muted-foreground uppercase'>
          <tr>
            <th className='px-4 py-3 text-left font-medium'>标题</th>
            <th className='px-4 py-3 text-left font-medium'>账号</th>
            <th className='px-4 py-3 text-left font-medium'>平台 · 站点</th>
            <th className='px-4 py-3 text-left font-medium'>发布时间</th>
            <th className='px-4 py-3 text-left font-medium'>状态</th>
            <th className='px-4 py-3 text-right font-medium'>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className='border-t transition-colors hover:bg-primary/5'
            >
              <td className='px-4 py-3 font-medium'>{item.title}</td>
              <td className='px-4 py-3'>{item.account}</td>
              <td className='px-4 py-3 text-muted-foreground'>
                {item.subtitle}
              </td>
              <td className='px-4 py-3'>{item.publishAt}</td>
              <td className='px-4 py-3'>
                <Select
                  value={item.status}
                  onValueChange={(status) =>
                    changeStatus(item.id, status as PublishScheduleStatus)
                  }
                >
                  <SelectTrigger className='h-7 w-28 py-0'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusValues.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className='px-4 py-3 text-right'>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`删除 ${item.title}`}
                  disabled={deleting === item.id}
                  onClick={() => void remove(item.id, item.title)}
                >
                  <Trash2 className='size-4' />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
