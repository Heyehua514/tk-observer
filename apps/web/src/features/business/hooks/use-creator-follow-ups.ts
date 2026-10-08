/** 达人触达跟进记录查询 Hook。 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CreatorFollowUp } from '../types'
import { mapCreatorFollowUp } from './creator-follow-up-mapper'

export const creatorFollowUpKeys = {
  all: ['creator-follow-ups'] as const,
  list: (creatorId: string) =>
    [...creatorFollowUpKeys.all, 'list', creatorId] as const,
}

export function useCreatorFollowUps(creatorId: string) {
  const queryClient = useQueryClient()
  const isSupabase = getDataProvider() === 'supabase'

  useEffect(() => {
    if (!creatorId || isSupabase) return
    let unsubscribe: (() => void) | undefined
    let disposed = false
    void pb
      .collection('creator_follow_ups')
      .subscribe('*', () => {
        void queryClient.invalidateQueries({
          queryKey: creatorFollowUpKeys.list(creatorId),
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
    queryKey: creatorFollowUpKeys.list(creatorId),
    queryFn: async (): Promise<CreatorFollowUp[]> => {
      if (isSupabase) {
        const { data, error } = await getSupabaseClient()
          .from('creator_follow_ups')
          .select('*')
          .eq('creator_id', creatorId)
          .is('deleted_at', null)
          .order('contacted_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapCreatorFollowUp)
      }
      try {
        const records = await pb
          .collection('creator_follow_ups')
          .getFullList({
            filter: pb.filter('creator = {:creatorId}', { creatorId }),
            sort: '-created',
          })
        return records.map(mapCreatorFollowUp)
      } catch {
        return []
      }
    },
    enabled: !!creatorId,
  })
}
