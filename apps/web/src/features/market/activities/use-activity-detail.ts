/** 市场活动详情查询；权限：market、boss；读取共享活动 collections。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import { mapEvent } from '../hooks/use-market-records'
import type { ActivityRelatedRecord } from './types'

function related(collection: string, eventId: string) {
  return pb.collection(collection).getFullList({
    filter: pb.filter('event = {:event}', { event: eventId }),
    sort: 'created',
  })
}

export function useActivityDetail(eventId: string) {
  return useQuery({
    queryKey: ['market', 'activity-detail', eventId],
    queryFn: async () => {
      const [
        event,
        phases,
        tasks,
        registrations,
        sponsorships,
        materials,
        finances,
      ] = await Promise.all([
        pb.collection('events').getOne(eventId),
        related('event_phases', eventId),
        related('event_tasks', eventId),
        related('event_registrations', eventId),
        related('event_sponsorships', eventId),
        related('event_materials', eventId),
        related('event_finances', eventId),
      ])
      const map = (item: Record<string, unknown>): ActivityRelatedRecord => ({
        id: String(item.id),
        status: typeof item.status === 'string' ? item.status : undefined,
        stage: typeof item.stage === 'string' ? item.stage : undefined,
        type: typeof item.type === 'string' ? item.type : undefined,
        amount: typeof item.amount === 'number' ? item.amount : undefined,
        completionPct:
          typeof item.completion_pct === 'number'
            ? item.completion_pct
            : undefined,
        title: typeof item.title === 'string' ? item.title : undefined,
        name: typeof item.name === 'string' ? item.name : undefined,
        company: typeof item.company === 'string' ? item.company : undefined,
        position: typeof item.position === 'string' ? item.position : undefined,
        category: typeof item.category === 'string' ? item.category : undefined,
        notes: typeof item.notes === 'string' ? item.notes : undefined,
      })
      return {
        event: mapEvent(event),
        phases: phases.map(map),
        tasks: tasks.map(map),
        registrations: registrations.map(map),
        sponsorships: sponsorships.map(map),
        materials: materials.map(map),
        finances: finances.map(map),
      }
    },
  })
}

export function useUpdateActivityTask(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      pb.collection('event_tasks').update(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['market', 'activity-detail', eventId],
      })
      toast.success('任务状态已更新')
    },
  })
}

export function useCreateActivityFinance(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      pb.collection('event_finances').create({ ...data, event: eventId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['market', 'activity-detail', eventId],
      })
      toast.success('财务明细已新增')
    },
  })
}
