/** 设计需求列表：状态筛选、需求提交和详情入口。 */
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { RequirementDetail } from './requirement-detail'
import { RequirementForm } from './requirement-form'
import { requirementStatusLabels } from './requirement-labels'
import {
  requirementStatuses,
  type RequirementStatus,
} from './requirement-rules'
import type { DesignRequirement } from './types'
import { useDesignRequirements } from './use-design-requirements'

export function DesignRequirements() {
  const user = useAuthStore((state) => state.user)
  const canRequest = user?.role === 'business' || user?.role === 'boss'
  const [status, setStatus] = useState<RequirementStatus | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<DesignRequirement | null>(null)
  const requirements = useDesignRequirements(status)
  const latestSelected =
    selected && requirements.data
      ? requirements.data.find((item) => item.id === selected.id) ?? selected
      : selected
  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as RequirementStatus | 'all')
          }
        >
          <SelectTrigger className='w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部状态</SelectItem>
            {requirementStatuses.map((item) => (
              <SelectItem value={item} key={item}>
                {requirementStatusLabels[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canRequest && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className='size-4' />
            提交设计需求
          </Button>
        )}
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>需求</TableHead>
              <TableHead>场景 / 尺寸</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>截止日期</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.data?.map((item) => (
              <TableRow
                key={item.id}
                className='cursor-pointer'
                onClick={() => setSelected(item)}
              >
                <TableCell>
                  <div className='font-medium'>{item.title}</div>
                  <div className='max-w-md truncate text-xs text-muted-foreground'>
                    {item.description}
                  </div>
                </TableCell>
                <TableCell>
                  {item.usageScene}
                  <div className='text-xs text-muted-foreground'>
                    {item.targetSize}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.priority === '高' ? 'destructive' : 'secondary'
                    }
                  >
                    {item.priority}
                  </Badge>
                </TableCell>
                <TableCell>{item.dueDate.slice(0, 10)}</TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className='border-primary/30 bg-primary/5 text-primary'
                  >
                    {requirementStatusLabels[item.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!requirements.isLoading && !requirements.data?.length && (
              <TableRow>
                <TableCell colSpan={5} className='p-0'>
                  <EmptyState
                    title='还没有设计需求'
                    description={
                      canRequest
                        ? '提交第一条完整需求，设计师即可开始接单。'
                        : '需求方提交后会在这里显示完整信息。'
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <RequirementForm
        open={formOpen}
        onOpenChange={setFormOpen}
        requester={user?.id || ''}
      />
      <RequirementDetail
        requirement={latestSelected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
