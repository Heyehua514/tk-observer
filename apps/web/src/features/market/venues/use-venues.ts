/** 市场工作台场地数据访问，Supabase-first，PocketBase 保留回退。 */
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { resolveStorageUrls } from '@/lib/storage-url'
import { getSupabaseClient } from '@/lib/supabase'
import type { Venue, VenueInput } from './types'
import { mapSupabaseVenue, serializeSupabaseVenue } from './venue-supabase-mapper'

const key = ['market', 'venue-resources'] as const
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
  photos: (Array.isArray(r.photos) ? r.photos : []).map((name: string) =>
    pb.files.getURL(r, name, { thumb: '900x600' })
  ),
  isVerified: Boolean(r.is_verified),
  usageCount: Number(r.usage_count || 0),
  created: r.created,
  updated: r.updated,
})

export function useVenueResources() {
  const qc = useQueryClient()
  useEffect(() => {
    if (getDataProvider() === 'supabase') return
    let stop: (() => void) | undefined
    void pb
      .collection('venues')
      .subscribe('*', () => void qc.invalidateQueries({ queryKey: key }))
      .then((fn) => {
        stop = fn
      })
    return () => stop?.()
  }, [qc])
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('venues')
          .select('*')
          .is('deleted_at', null)
          .order('is_verified', { ascending: false })
          .order('updated_at', { ascending: false })
        if (error) throw error
        const venues = (data || []).map(mapSupabaseVenue)
        const paths = venues.flatMap((venue) => venue.photos)
        const urls = await resolveStorageUrls('venue-photos', paths)
        return venues.map((venue) => ({
          ...venue,
          photos: venue.photos.map((path) => urls[path] || ''),
        }))
      }
      return (
        await pb
          .collection('venues')
          .getFullList({ sort: '-is_verified,-updated' })
      ).map(mapVenue)
    },
  })
}

export function useVenueEvents(venueId?: string) {
  return useQuery({
    queryKey: [...key, venueId, 'events'],
    enabled: Boolean(venueId),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('events')
          .select('id,name,start_date,status')
          .eq('venue_id', String(venueId || ''))
          .is('deleted_at', null)
          .order('start_date', { ascending: false })
        if (error) throw error
        return data || []
      }
      return pb.collection('events').getFullList({
        filter: pb.filter('venue = {:id}', { id: venueId }),
        sort: '-start_date',
        fields: 'id,name,start_date,status',
      })
    },
  })
}

function append(form: FormData, input: VenueInput) {
  const data: Record<string, string | number | boolean> = {
    name: input.name,
    type: input.type,
    city: input.city,
    address: input.address,
    capacity_min: input.capacityMin,
    capacity_max: input.capacityMax,
    price_range: input.priceRange,
    scene_tags: input.sceneTags,
    pros: input.pros,
    cons: input.cons,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    site_visit_date: input.siteVisitDate,
    site_visit_notes: input.siteVisitNotes,
    is_verified: input.isVerified,
  }
  Object.entries(data).forEach(([name, value]) =>
    form.append(name, String(value))
  )
}
export function useSaveVenueResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
      files,
    }: {
      id?: string
      input: VenueInput
      files: File[]
    }) => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const photoPaths: string[] = []
        for (const file of files) {
          const filePath = `${id || 'new'}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '-')}`
          const upload = await supabase.storage
            .from('venue-photos')
            .upload(filePath, file, { upsert: false })
          if (upload.error) throw upload.error
          photoPaths.push(filePath)
        }
        const payload = {
          ...serializeSupabaseVenue(input),
          ...(photoPaths.length ? { photo_paths: photoPaths } : {}),
        }
        const { error } = id
          ? await supabase.from('venues').update(payload).eq('id', id)
          : await supabase.from('venues').insert(payload)
        if (error) throw error
        return
      }
      const form = new FormData()
      append(form, input)
      files.forEach((file) => form.append('photos', file))
      return id
        ? pb.collection('venues').update(id, form)
        : pb.collection('venues').create(form)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key })
      toast.success('场地已保存')
    },
  })
}
