/** 剪辑工作台视频任务查询：只读读取已有 video_tasks 表。 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import {
  buildVideoTaskItems,
  type VideoTaskItem,
} from '../components/production-model'
import { useEditingRealtime } from './use-editing-realtime'

export const videoTaskKeys = {
  all: ['video-tasks'] as const,
}

type VideoTaskRecord = {
  id: string
  title: string
  product_name: string
  creator_name: string
  status: string
  due_at: string
  owner: string
}

export function useVideoTasks() {
  useEditingRealtime('video_tasks', videoTaskKeys.all)
  return useQuery({
    queryKey: videoTaskKeys.all,
    queryFn: async (): Promise<VideoTaskItem[]> => {
      const records = await pb.collection('video_tasks').getFullList({
        sort: 'due_at',
      })
      return buildVideoTaskItems(
        records.map((record) => ({
          id: record.id,
          title: String((record as unknown as VideoTaskRecord).title || ''),
          productName: String(
            (record as unknown as VideoTaskRecord).product_name || ''
          ),
          creatorName: String(
            (record as unknown as VideoTaskRecord).creator_name || ''
          ),
          status: String((record as unknown as VideoTaskRecord).status || ''),
          dueAt: String((record as unknown as VideoTaskRecord).due_at || ''),
          owner: String((record as unknown as VideoTaskRecord).owner || ''),
        }))
      )
    },
    placeholderData: keepPreviousData,
  })
}
