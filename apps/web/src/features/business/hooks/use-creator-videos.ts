/**
 * 达人详情的关联视频查询。
 * 只暴露商务页需要的视频摘要，不依赖 editing feature。
 * Supabase-first，PocketBase 保留显式回退。
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CreatorVideo } from '../types'

type CreatorVideoRecord = {
  id?: unknown
  title?: unknown
  product_name?: unknown
  region?: unknown
  publish_at?: unknown
  publishAt?: unknown
  updated_at?: unknown
  updated?: unknown
}

export function mapCreatorVideoRecord(
  record: CreatorVideoRecord
): CreatorVideo {
  return {
    id: String(record.id || ''),
    title: String(record.title || ''),
    productName: String(record.product_name || ''),
    region: record.region as CreatorVideo['region'],
    publishAt: String(record.publish_at || record.publishAt || ''),
    updated: String(record.updated_at || record.updated || ''),
  }
}

const creatorVideoKeys = {
  all: ['creator-videos'] as const,
  list: (creatorId: string) =>
    [...creatorVideoKeys.all, 'list', creatorId] as const,
}

export function useCreatorVideos(creatorId: string) {
  const queryClient = useQueryClient()
  const isSupabase = getDataProvider() === 'supabase'
  useEffect(() => {
    if (!creatorId || isSupabase) return
    let unsubscribe: (() => void) | undefined
    let disposed = false
    void pb
      .collection('videos')
      .subscribe('*', () => {
        void queryClient.invalidateQueries({
          queryKey: creatorVideoKeys.list(creatorId),
        })
      })
      .then((stop) => {
        if (disposed) stop()
        else unsubscribe = stop
      })
    return () => {
      disposed = true
      unsubscribe?.()
    }
  }, [creatorId, isSupabase, queryClient])

  return useQuery({
    queryKey: creatorVideoKeys.list(creatorId),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('videos')
          .select('id,title,product_name,region,publish_at,updated_at')
          .eq('creator_id', creatorId)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapCreatorVideoRecord)
      }
      const records = await pb.collection('videos').getFullList({
        filter: pb.filter('creator = {:creatorId}', { creatorId }),
        sort: '-updated',
      })
      return records.map(mapCreatorVideoRecord)
    },
    enabled: !!creatorId,
  })
}
