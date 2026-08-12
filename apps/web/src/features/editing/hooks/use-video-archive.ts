/** 剪辑工作台成片归档查询：只读读取已有 videos 表。 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { createSupabasePageQuery } from '@/lib/supabase-table'
import {
  buildVideoArchiveItems,
  type VideoArchiveItem,
} from '../components/production-model'
import { mapSupabaseVideoArchiveRecord } from './editing-supabase-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const videoArchiveKeys = {
  all: ['video-archive'] as const,
}

type VideoArchiveRecord = {
  id: string
  title: string
  product_name: string
  creator_name: string
  publish_at: string
  file: string
}

export function useVideoArchive() {
  useEditingRealtime('videos', videoArchiveKeys.all)
  return useQuery({
    queryKey: videoArchiveKeys.all,
    queryFn: async (): Promise<VideoArchiveItem[]> => {
      if (getDataProvider() === 'supabase') {
        const page = await createSupabasePageQuery({
          table: 'videos',
          page: 1,
          perPage: 500,
          sort: 'publish_at.desc',
          mapRow: mapSupabaseVideoArchiveRecord,
        })
        return page.items
      }
      const records = await pb.collection('videos').getFullList({
        sort: '-publish_at',
      })
      return buildVideoArchiveItems(
        records.map((record) => ({
          id: record.id,
          title: String((record as unknown as VideoArchiveRecord).title || ''),
          productName: String(
            (record as unknown as VideoArchiveRecord).product_name || ''
          ),
          creatorName: String(
            (record as unknown as VideoArchiveRecord).creator_name || ''
          ),
          publishAt: String(
            (record as unknown as VideoArchiveRecord).publish_at || ''
          ),
          fileUrl: String((record as unknown as VideoArchiveRecord).file || ''),
        }))
      )
    },
    placeholderData: keepPreviousData,
  })
}
