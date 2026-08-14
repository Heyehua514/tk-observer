/** 剪辑工作台发布排期查询：读取 publish_schedules 表（Supabase-first，PocketBase 显式回退）。 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { createSupabasePageQuery } from '@/lib/supabase-table'
import {
  buildPublishScheduleItems,
  type PublishScheduleItem,
} from '../components/production-model'
import { mapSupabasePublishScheduleRecord } from './editing-supabase-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const publishScheduleKeys = {
  all: ['publish-schedules'] as const,
}

type PublishScheduleRecord = {
  id: string
  title: string
  account: string
  platform: string
  region: string
  publish_at: string
  status: string
}

export function usePublishSchedules() {
  useEditingRealtime('publish_schedules', publishScheduleKeys.all)
  return useQuery({
    queryKey: publishScheduleKeys.all,
    queryFn: async (): Promise<PublishScheduleItem[]> => {
      if (getDataProvider() === 'supabase') {
        const page = await createSupabasePageQuery({
          table: 'publish_schedules',
          page: 1,
          perPage: 500,
          sort: 'publish_at.desc',
          mapRow: mapSupabasePublishScheduleRecord,
        })
        return page.items
      }
      const records = await pb.collection('publish_schedules').getFullList({
        sort: '-publish_at',
      })
      return buildPublishScheduleItems(
        records.map((record) => ({
          id: String((record as unknown as PublishScheduleRecord).id || ''),
          title: String(
            (record as unknown as PublishScheduleRecord).title || ''
          ),
          account: String(
            (record as unknown as PublishScheduleRecord).account || ''
          ),
          platform: String(
            (record as unknown as PublishScheduleRecord).platform || ''
          ),
          region: String(
            (record as unknown as PublishScheduleRecord).region || ''
          ),
          publishAt: String(
            (record as unknown as PublishScheduleRecord).publish_at || ''
          ),
          status: String(
            (record as unknown as PublishScheduleRecord).status || ''
          ),
        }))
      )
    },
    placeholderData: keepPreviousData,
  })
}
