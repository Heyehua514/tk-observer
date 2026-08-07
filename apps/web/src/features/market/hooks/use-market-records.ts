import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import type { Event, EventInput, Venue, VenueInput } from '../types'

const mapEvent = (r: RecordModel): Event => ({
  id: r.id,
  name: String(r.name),
  type: r.type as Event['type'],
  theme: String(r.theme || ''),
  startDate: String(r.start_date || ''),
  locationCity: String(r.location_city),
  targetAttendees: Number(r.target_attendees || 0),
  targetSponsorship: Number(r.target_sponsorship || 0),
  totalBudget: Number(r.total_budget || 0),
  status: r.status as Event['status'],
  created: r.created,
  updated: r.updated,
})
const mapVenue = (r: RecordModel): Venue => ({
  id: r.id,
  name: String(r.name),
  type: r.type as Venue['type'],
  city: String(r.city),
  address: String(r.address || ''),
  capacityMin: Number(r.capacity_min || 0),
  capacityMax: Number(r.capacity_max || 0),
  priceRange: String(r.price_range || ''),
  sceneTags: String(r.scene_tags || ''),
  pros: String(r.pros || ''),
  cons: String(r.cons || ''),
  contactName: String(r.contact_name || ''),
  contactPhone: String(r.contact_phone || ''),
  siteVisitDate: String(r.site_visit_date || ''),
  siteVisitNotes: String(r.site_visit_notes || ''),
  isVerified: Boolean(r.is_verified),
  usageCount: Number(r.usage_count || 0),
  created: r.created,
  updated: r.updated,
})
const eventData = (i: EventInput) => ({
  name: i.name,
  type: i.type,
  theme: i.theme,
  start_date: i.startDate,
  location_city: i.locationCity,
  target_attendees: i.targetAttendees,
  target_sponsorship: i.targetSponsorship,
  total_budget: i.totalBudget,
  status: i.status,
})
const venueData = (i: VenueInput) => ({
  name: i.name,
  type: i.type,
  city: i.city,
  address: i.address,
  capacity_min: i.capacityMin,
  capacity_max: i.capacityMax,
  price_range: i.priceRange,
  scene_tags: i.sceneTags,
  pros: i.pros,
  cons: i.cons,
  contact_name: i.contactName,
  contact_phone: i.contactPhone,
  site_visit_date: i.siteVisitDate,
  site_visit_notes: i.siteVisitNotes,
  is_verified: i.isVerified,
})
export const marketKeys = {
  events: ['market', 'events'] as const,
  venues: ['market', 'venues'] as const,
}
function useRealtime(collection: string, key: readonly string[]) {
  const qc = useQueryClient()
  useEffect(() => {
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
      const page = await pb.collection('events').getList(1, 100, {
        sort: '-start_date',
        filter: query
          ? pb.filter('name ~ {:q} || theme ~ {:q} || location_city ~ {:q}', {
              q: query,
            })
          : '',
      })
      return page.items.map(mapEvent)
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
      return page.items.map(mapVenue)
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
    }) =>
      id
        ? pb.collection(collection).update(id, data)
        : pb.collection(collection).create(data),
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
    mutationFn: (id: string) => pb.collection('events').delete(id),
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
export { mapEvent, mapVenue, eventData, venueData }
