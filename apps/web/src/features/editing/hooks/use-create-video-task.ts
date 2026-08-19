/**
 * 剪辑工作台视频任务新增/更新 mutation（Supabase-first，PocketBase 回退）。
 * 字段对齐 remote video_tasks（owner, region）; 状态支持 todo/editing/review/done。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/types/database.generated'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { videoTaskKeys } from './use-video-tasks'

type VideoTaskRowInsert = Database['public']['Tables']['video_tasks']['Insert']

export type VideoTaskInput = {
  title: string
  productName: string
  creatorName: string
  owner: string
  region: string
  status: string
  dueAt: string
}

export function useCreateVideoTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VideoTaskInput) => {
      const payload = {
        title: input.title,
        product_name: input.productName || null,
        creator_name: input.creatorName || null,
        owner_name: input.owner,
        region: input.region || 'US',
        status: input.status ?? 'todo',
        due_at: input.dueAt
          ? new Date(`${input.dueAt}T00:00:00+08:00`).toISOString()
          : null,
      }
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('video_tasks')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        return data
      }
      return pb.collection('video_tasks').create(payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoTaskKeys.all })
      toast.success('视频任务已创建')
    },
    onError: () => toast.error('创建失败，请检查输入后重试'),
  })
}

export function useUpdateVideoTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Partial<VideoTaskInput>
    }) => {
      const payload: Partial<VideoTaskRowInsert> = {}
      if (input.title !== undefined) payload.title = input.title
      if (input.productName !== undefined)
        payload.product_name = input.productName || null
      if (input.creatorName !== undefined)
        payload.creator_name = input.creatorName || null
      if (input.owner !== undefined) payload.owner_name = input.owner
      if (input.region !== undefined) payload.region = input.region
      if (input.status !== undefined) payload.status = input.status
      if (input.dueAt !== undefined)
        payload.due_at = input.dueAt
          ? new Date(`${input.dueAt}T00:00:00+08:00`).toISOString()
          : null
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('video_tasks')
          .update(payload)
          .eq('id', id)
          .select('id')
          .single()
        if (error) throw error
        return data
      }
      return pb.collection('video_tasks').update(id, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoTaskKeys.all })
      toast.success('视频任务已更新')
    },
    onError: () => toast.error('更新失败，请重试'),
  })
}
