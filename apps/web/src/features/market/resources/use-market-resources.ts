/** 市场资源库数据层：market 和 boss 角色按 PocketBase 规则读写。 */
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
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
    queryFn: async (): Promise<EventOption[]> =>
      (await pb.collection('events').getFullList({ sort: '-start_date' })).map(
        (record) => ({
          id: record.id,
          name: String(record.name),
          city: String(record.location_city || ''),
          date: String(record.start_date || '').slice(0, 10),
          theme: String(record.theme || ''),
        })
      ),
  })
}

export function useEventTemplates() {
  useRealtime('event_templates', keys.templates)
  return useQuery({
    queryKey: keys.templates,
    queryFn: async (): Promise<EventTemplate[]> =>
      (
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
      })),
  })
}

export function useSaveTemplate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      type: TemplateType
      eventType: TemplateEventType
      content: string
      tags: string
    }) =>
      pb.collection('event_templates').create({
        name: data.name,
        type: data.type,
        event_type: data.eventType,
        content: data.content,
        tags: data.tags,
        usage_count: 0,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.templates })
      toast.success('文案模板已保存')
    },
  })
}

export function useMarkTemplateUsed() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, usageCount }: { id: string; usageCount: number }) =>
      pb.collection('event_templates').update(id, {
        usage_count: usageCount + 1,
        last_used_at: new Date().toISOString(),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: keys.templates }),
  })
}

export function useEventMaterials(eventId?: string) {
  useRealtime('event_materials', keys.materials)
  return useQuery({
    queryKey: [...keys.materials, eventId || 'all'],
    queryFn: async (): Promise<EventMaterial[]> =>
      (
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
      })),
  })
}

export function useSaveMaterial() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      eventId: string
      name: string
      type: MaterialType
      status: MaterialStatus
      notes: string
      file?: File
    }) => {
      const data = new FormData()
      if (input.eventId) data.set('event', input.eventId)
      data.set('name', input.name)
      data.set('type', input.type)
      data.set('status', input.status)
      data.set('notes', input.notes)
      if (input.file) data.set('file', input.file)
      return pb.collection('event_materials').create(data)
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
    queryFn: async (): Promise<EventFinance[]> =>
      (
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
      })),
  })
}

export function useSaveFinance() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      eventId: string
      category: FinanceCategory
      type: FinanceType
      amount: number
      description: string
      paidBy: string
      paidAt: string
    }) =>
      pb.collection('event_finances').create({
        event: input.eventId,
        category: input.category,
        type: input.type,
        amount: input.amount,
        description: input.description,
        paid_by: input.paidBy,
        paid_at: input.paidAt,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.finances })
      toast.success('财务明细已保存')
    },
  })
}
