/** 市场资源库数据层，Supabase-first，PocketBase 保留回退。 */
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import {
  mapSupabaseEventFinance,
  mapSupabaseEventMaterial,
  mapSupabaseEventTemplate,
  mapSupabaseResourceEvent,
  serializeSupabaseEventFinance,
} from './market-resource-supabase-mapper'
import type {
  EventFinance,
  EventMaterial,
  EventOption,
  EventTemplate,
  FinanceCategory,
  FinanceType,
  MaterialStatus,
  MaterialType,
  TemplateEventType,
  TemplateType,
} from './types'

const keys = {
  templates: ['market', 'resources', 'templates'] as const,
  materials: ['market', 'resources', 'materials'] as const,
  finances: ['market', 'resources', 'finances'] as const,
  events: ['market', 'resources', 'events'] as const,
}

const expandedName = (record: RecordModel) => {
  const expanded = record.expand?.event
  const event = Array.isArray(expanded) ? expanded[0] : expanded
  return event ? String(event.name || '') : ''
}

function useRealtime(collection: string, queryKey: readonly string[]) {
  const client = useQueryClient()
  useEffect(() => {
    if (getDataProvider() === 'supabase') return
    let stop: (() => void) | undefined
    let disposed = false
    void pb
      .collection(collection)
      .subscribe('*', () => void client.invalidateQueries({ queryKey }))
      .then((unsubscribe) => {
        if (disposed) unsubscribe()
        else stop = unsubscribe
      })
    return () => {
      disposed = true
      stop?.()
    }
  }, [client, collection, queryKey])
}

export function useResourceEvents() {
  return useQuery({
    queryKey: keys.events,
    queryFn: async (): Promise<EventOption[]> => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('events')
          .select('id,name,location_city,start_date,theme')
          .is('deleted_at', null)
          .order('start_date', { ascending: false })
        if (error) throw error
        return (data || []).map(mapSupabaseResourceEvent)
      }
      return (await pb.collection('events').getFullList({ sort: '-start_date' })).map(
        (record) => ({
          id: record.id,
          name: String(record.name),
          city: String(record.location_city || ''),
          date: String(record.start_date || '').slice(0, 10),
          theme: String(record.theme || ''),
        })
      )
    },
  })
}

export function useEventTemplates() {
  useRealtime('event_templates', keys.templates)
  return useQuery({
    queryKey: keys.templates,
    queryFn: async (): Promise<EventTemplate[]> => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('event_templates')
          .select('*')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapSupabaseEventTemplate)
      }
      return (
        await pb.collection('event_templates').getFullList({ sort: '-updated' })
      ).map((record) => ({
        id: record.id,
        name: String(record.name),
        type: record.type as TemplateType,
        eventType: record.event_type as TemplateEventType,
        content: String(record.content),
        tags: String(record.tags || ''),
        usageCount: Number(record.usage_count || 0),
        lastUsedAt: String(record.last_used_at || ''),
      }))
    },
  })
}

export function useSaveTemplate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      type: TemplateType
      eventType: TemplateEventType
      content: string
      tags: string
    }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('event_templates')
          .insert({
            name: data.name,
            type: data.type,
            event_type: data.eventType,
            content: data.content,
            tags: data.tags || null,
            usage_count: 0,
          })
        if (error) throw error
        return
      }
      await pb.collection('event_templates').create({
        name: data.name,
        type: data.type,
        event_type: data.eventType,
        content: data.content,
        tags: data.tags,
        usage_count: 0,
      })
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.templates })
      toast.success('文案模板已保存')
    },
  })
}

export function useMarkTemplateUsed() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, usageCount }: { id: string; usageCount: number }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('event_templates')
          .update({
            usage_count: usageCount + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', id)
        if (error) throw error
        return
      }
      return pb.collection('event_templates').update(id, {
        usage_count: usageCount + 1,
        last_used_at: new Date().toISOString(),
      })
    },
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: keys.templates }),
  })
}

export function useEventMaterials(eventId?: string) {
  useRealtime('event_materials', keys.materials)
  return useQuery({
    queryKey: [...keys.materials, eventId || 'all'],
    queryFn: async (): Promise<EventMaterial[]> => {
      if (getDataProvider() === 'supabase') {
        let request = getSupabaseClient()
          .from('event_materials')
          .select('*, events(name)')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (eventId) request = request.eq('event_id', eventId)
        const { data, error } = await request
        if (error) throw error
        return (data || []).map(mapSupabaseEventMaterial)
      }
      return (
        await pb.collection('event_materials').getFullList({
          sort: '-updated',
          expand: 'event',
          filter: eventId ? pb.filter('event = {:eventId}', { eventId }) : '',
        })
      ).map((record) => ({
        id: record.id,
        eventId: String(record.event || ''),
        eventName: expandedName(record),
        type: record.type as MaterialType,
        name: String(record.name),
        file: String(record.file || ''),
        status: record.status as MaterialStatus,
        notes: String(record.notes || ''),
      }))
    },
  })
}

export function useSaveMaterial() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      eventId: string
      name: string
      type: MaterialType
      status: MaterialStatus
      notes: string
      file?: File
    }) => {
      if (getDataProvider() === 'supabase') {
        const save = async () => {
          let filePath: string | null = null
          if (input.file) {
            filePath = `${input.eventId || 'general'}/${Date.now()}-${input.file.name.replace(/[^\w.-]+/g, '-')}`
            const upload = await getSupabaseClient().storage
              .from('event-materials')
              .upload(filePath, input.file, { upsert: false })
            if (upload.error) throw upload.error
          }
          const { error } = await getSupabaseClient()
            .from('event_materials')
            .insert({
              event_id: input.eventId || null,
              name: input.name,
              type: input.type,
              status: input.status,
              notes: input.notes || null,
              file_path: filePath,
            })
          if (error) throw error
        }
        await save()
        return
      }
      const data = new FormData()
      if (input.eventId) data.set('event', input.eventId)
      data.set('name', input.name)
      data.set('type', input.type)
      data.set('status', input.status)
      data.set('notes', input.notes)
      if (input.file) data.set('file', input.file)
      await pb.collection('event_materials').create(data)
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.materials })
      toast.success('活动物料已保存')
    },
  })
}

export function useEventFinances(eventId?: string) {
  useRealtime('event_finances', keys.finances)
  return useQuery({
    queryKey: [...keys.finances, eventId || 'all'],
    queryFn: async (): Promise<EventFinance[]> => {
      if (getDataProvider() === 'supabase') {
        let request = getSupabaseClient()
          .from('event_finances')
          .select('*, events(name)')
          .is('deleted_at', null)
          .order('paid_at', { ascending: false })
        if (eventId) request = request.eq('event_id', eventId)
        const { data, error } = await request
        if (error) throw error
        return (data || []).map(mapSupabaseEventFinance)
      }
      return (
        await pb.collection('event_finances').getFullList({
          sort: '-paid_at',
          expand: 'event',
          filter: eventId ? pb.filter('event = {:eventId}', { eventId }) : '',
        })
      ).map((record) => ({
        id: record.id,
        eventId: String(record.event),
        eventName: expandedName(record),
        category: record.category as FinanceCategory,
        type: record.type as FinanceType,
        amount: Number(record.amount || 0),
        description: String(record.description),
        paidBy: String(record.paid_by || ''),
        paidAt: String(record.paid_at || '').slice(0, 10),
      }))
    },
  })
}

export function useSaveFinance() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      eventId: string
      category: FinanceCategory
      type: FinanceType
      amount: number
      description: string
      paidBy: string
      paidAt: string
    }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('event_finances')
          .insert(serializeSupabaseEventFinance(input))
        if (error) throw error
        return
      }
      await pb.collection('event_finances').create({
        event: input.eventId,
        category: input.category,
        type: input.type,
        amount: input.amount,
        description: input.description,
        paid_by: input.paidBy,
        paid_at: input.paidAt,
      })
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.finances })
      toast.success('财务明细已保存')
    },
  })
}
