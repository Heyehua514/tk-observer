/** 设计任务列表、新建和状态更新 hooks。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  mapSupabaseDesignTask,
  serializeSupabaseDesignTask,
} from './design-task-supabase-mapper'
import type { DesignTask, DesignTaskInput, DesignTaskStatus } from './types'

export const designTaskKeys = { all: ['design', 'tasks'] as const }

export function useDesignTasks() {
  return useQuery({
    queryKey: designTaskKeys.all,
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('design_tasks')
          .select('*')
          .is('deleted_at', null)
          .order('due_at', { ascending: true })
        if (error) throw error
        return (data || []).map(mapSupabaseDesignTask)
      }
      return (
        await pb.collection('design_tasks').getFullList({ sort: 'due_at' })
      ).map((record): DesignTask => ({
        id: record.id,
        title: String(record.title || ''),
        status: (record.status || 'todo') as DesignTaskStatus,
        dueAt: String(record.due_at || ''),
        region: record.region as DesignTask['region'],
      }))
    },
  })
}

export function useCreateDesignTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DesignTaskInput) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('design_tasks')
          .insert(serializeSupabaseDesignTask(input))
        if (error) throw error
        return
      }
      return pb.collection('design_tasks').create({
        title: input.title,
        status: 'todo',
        due_at: input.dueAt,
        region: input.region,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: designTaskKeys.all })
      toast.success('设计任务已新增')
    },
  })
}

export function useUpdateDesignTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: DesignTaskStatus
    }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('design_tasks')
          .update({ status })
          .eq('id', id)
        if (error) throw error
        return
      }
      return pb.collection('design_tasks').update(id, { status })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: designTaskKeys.all })
      toast.success('任务状态已更新')
    },
  })
}
