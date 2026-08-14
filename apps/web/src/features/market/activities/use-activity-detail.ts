/** 市场活动详情查询；权限：market、boss；读取共享活动 collections。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapEvent } from '../hooks/use-market-records'
import { mapMarketRelatedRecord } from '../hooks/market-mappers'

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
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const [event, phases, tasks, registrations, sponsorships] =
          await Promise.all([
            supabase.from('events').select('*').eq('id', eventId).single(),
            supabase
              .from('event_phases')
              .select('*')
              .eq('event_id', eventId)
              .is('deleted_at', null)
              .order('created_at', { ascending: true }),
            supabase
              .from('event_tasks')
              .select('*')
              .eq('event_id', eventId)
              .is('deleted_at', null)
              .order('created_at', { ascending: true }),
            supabase
              .from('event_registrations')
              .select('*')
              .eq('event_id', eventId)
              .is('deleted_at', null)
              .order('created_at', { ascending: true }),
            supabase
              .from('event_sponsorships')
              .select('*, clients(company, name)')
              .eq('event_id', eventId)
              .is('deleted_at', null)
              .order('created_at', { ascending: true }),
          ])
        for (const result of [
          event,
          phases,
          tasks,
          registrations,
          sponsorships,
        ]) {
          if (result.error) throw result.error
        }
        if (!event.data) throw new Error('活动不存在')
        return {
          event: mapEvent(event.data),
          phases: (phases.data || []).map(mapMarketRelatedRecord),
          tasks: (tasks.data || []).map(mapMarketRelatedRecord),
          registrations: (registrations.data || []).map(
            mapMarketRelatedRecord
          ),
          sponsorships: (sponsorships.data || []).map(mapMarketRelatedRecord),
          materials: [],
          finances: [],
        }
      }
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
      return {
        event: mapEvent(event),
        phases: phases.map(mapMarketRelatedRecord),
        tasks: tasks.map(mapMarketRelatedRecord),
        registrations: registrations.map(mapMarketRelatedRecord),
        sponsorships: sponsorships.map(mapMarketRelatedRecord),
        materials: materials.map(mapMarketRelatedRecord),
        finances: finances.map(mapMarketRelatedRecord),
      }
    },
  })
}

export function useUpdateActivityTask(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('event_tasks')
          .update({ status })
          .eq('id', id)
        if (error) throw error
        return
      }
      return pb.collection('event_tasks').update(id, { status })
    },
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
