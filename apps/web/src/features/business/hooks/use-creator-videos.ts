/**
 * 达人详情的关联视频查询。
 * 只暴露商务页需要的视频摘要，不依赖 editing feature。
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import type { CreatorVideo } from '../types'

const creatorVideoKeys = {
  all: ['creator-videos'] as const,
  list: (creatorId: string) =>
    [...creatorVideoKeys.all, 'list', creatorId] as const,
}

export function useCreatorVideos(creatorId: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!creatorId) return
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
  }, [creatorId, queryClient])

  return useQuery({
    queryKey: creatorVideoKeys.list(creatorId),
    queryFn: async () => {
      const records = await pb.collection('videos').getFullList({
        filter: pb.filter('creator = {:creatorId}', { creatorId }),
        sort: '-updated',
      })
      return records.map((record): CreatorVideo => ({
        id: record.id,
        title: String(record.title),
        productName: String(record.product_name || ''),
        region: record.region as CreatorVideo['region'],
        publishAt: String(record.publish_at || ''),
        updated: String(record.updated),
      }))
    },
    enabled: !!creatorId,
  })
}
