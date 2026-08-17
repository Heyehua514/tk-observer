import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  mapMarketEventRecord,
  mapMarketVenueRecord,
  serializeMarketEvent,
  serializeMarketVenue,
  toSupabaseMarketSearch,
} from './market-mappers'

export const marketKeys = {
  events: ['market', 'events'] as const,
  venues: ['market', 'venues'] as const,
}
function useRealtime(collection: string, key: readonly string[]) {
  const qc = useQueryClient()
  useEffect(() => {
    if (getDataProvider() === 'supabase') return
    let stop: (() => void) | undefined
    let disposed = false
    void pb
      .collection(collection)
      .subscribe('*', () => void qc.invalidateQueries({ queryKey: key }))
      .then((s) => {
        if (disposed) s()
        else stop = s
      })
    return () => {
      disposed = true
      stop?.()
    }
  }, [collection, key, qc])
}
export function useEvents(query = '') {
  useRealtime('events', marketKeys.events)
  return useQuery({
    queryKey: [...marketKeys.events, query],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        let request = supabase
          .from('events')
          .select('*')
          .is('deleted_at', null)
          .order('start_date', { ascending: false })
          .range(0, 99)
        if (query) {
          const escaped = toSupabaseMarketSearch(query)
          request = request.or(
            `name.ilike.%${escaped}%,theme.ilike.%${escaped}%,location_city.ilike.%${escaped}%`
          )
        }
        const { data, error } = await request
        if (error) throw error
        return (data || []).map(mapMarketEventRecord)
      }
      const page = await pb.collection('events').getList(1, 100, {
        sort: '-start_date',
        filter: query
          ? pb.filter('name ~ {:q} || theme ~ {:q} || location_city ~ {:q}', {
              q: query,
            })
          : '',
      })
      return page.items.map(mapMarketEventRecord)
    },
  })
}
export function useVenues(query = '') {
  useRealtime('venues', marketKeys.venues)
  return useQuery({
    queryKey: [...marketKeys.venues, query],
    queryFn: async () => {
      const page = await pb.collection('venues').getList(1, 100, {
        sort: '-updated',
        filter: query
          ? pb.filter('name ~ {:q} || city ~ {:q} || scene_tags ~ {:q}', {
              q: query,
            })
          : '',
      })
      return page.items.map(mapMarketVenueRecord)
    },
  })
}
function useRecordMutation(
  collection: string,
  key: readonly string[],
  label: string
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string
      data: Record<string, unknown>
    }) => {
      if (getDataProvider() === 'supabase' && collection === 'events') {
        const table = getSupabaseClient().from('events')
        const eventPayload = data as Parameters<typeof table.insert>[0]
        if (id) {
          const { error } = await table.update(eventPayload).eq('id', id)
          if (error) throw error
          return
        }
        const { error } = await table.insert(eventPayload)
        if (error) throw error
        return
      }
      return id
        ? pb.collection(collection).update(id, data)
        : pb.collection(collection).create(data)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key })
      toast.success(label)
    },
  })
}
export function useSaveEvent() {
  return useRecordMutation('events', marketKeys.events, '活动已保存')
}
export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('events')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        return
      }
      return pb.collection('events').delete(id)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: marketKeys.events })
      toast.success('活动已删除')
    },
  })
}
export function useSaveVenue() {
  return useRecordMutation('venues', marketKeys.venues, '场地已保存')
}
export function useDeleteVenue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pb.collection('venues').delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: marketKeys.venues })
      toast.success('场地已删除')
    },
  })
}
export {
  mapMarketEventRecord as mapEvent,
  mapMarketVenueRecord as mapVenue,
  serializeMarketEvent as eventData,
  serializeMarketVenue as venueData,
}
