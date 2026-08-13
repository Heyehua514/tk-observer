/** 设计需求、参考和交付记录的数据 hooks。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { RequirementStatus } from './requirement-rules'
import {
  mapSupabaseDesignDeliverable,
  mapSupabaseDesignReference,
  mapSupabaseDesignRequirement,
  serializeSupabaseDesignRequirement,
} from './design-requirement-supabase-mapper'
import type {
  DesignDeliverable,
  DesignReference,
  DesignRequirement,
  DesignRequirementInput,
} from './types'

export const designRequirementKeys = {
  all: ['design', 'requirements'] as const,
  detail: (id: string) => ['design', 'requirements', id] as const,
}

const mapRequirement = (record: RecordModel): DesignRequirement => ({
  id: record.id,
  title: String(record.title || ''),
  description: String(record.description || ''),
  requester: String(record.requester || ''),
  targetSize: String(record.target_size || ''),
  usageScene: String(record.usage_scene || ''),
  copyContent: String(record.copy_content || ''),
  deliveryFormat: String(record.delivery_format || ''),
  referenceUrls: String(record.reference_urls || ''),
  status: (record.status || 'pending') as RequirementStatus,
  priority: (record.priority || '中') as DesignRequirement['priority'],
  dueDate: String(record.due_date || ''),
  created: String(record.created || ''),
})

export function useDesignRequirements(status: RequirementStatus | 'all') {
  return useQuery({
    queryKey: [...designRequirementKeys.all, status],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const request =
          status === 'all'
            ? getSupabaseClient()
                .from('design_requirements')
                .select('*')
                .is('deleted_at', null)
                .order('due_date', { ascending: true })
            : getSupabaseClient()
                .from('design_requirements')
                .select('*')
                .eq('status', status)
                .is('deleted_at', null)
                .order('due_date', { ascending: true })
        const { data, error } = await request
        if (error) throw error
        return (data || []).map(mapSupabaseDesignRequirement)
      }
      return (
        await pb.collection('design_requirements').getFullList({
          sort: 'due_date',
          filter:
            status === 'all' ? '' : pb.filter('status = {:status}', { status }),
        })
      ).map(mapRequirement)
    },
  })
}

export function useCreateDesignRequirement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DesignRequirementInput) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('design_requirements')
          .insert(serializeSupabaseDesignRequirement(input))
        if (error) throw error
        return
      }
      return pb.collection('design_requirements').create({
        title: input.title,
        description: input.description,
        requester: input.requester,
        target_size: input.targetSize,
        usage_scene: input.usageScene,
        copy_content: input.copyContent,
        delivery_format: input.deliveryFormat,
        reference_urls: input.referenceUrls,
        priority: input.priority,
        due_date: input.dueDate,
        status: 'pending',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: designRequirementKeys.all,
      })
      toast.success('设计需求已提交')
    },
  })
}

export function useUpdateRequirementStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: RequirementStatus
    }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('design_requirements')
          .update({ status })
          .eq('id', id)
        if (error) throw error
        return
      }
      return pb.collection('design_requirements').update(id, { status })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: designRequirementKeys.all,
      })
      toast.success('需求状态已更新')
    },
  })
}

export function useRequirementRelations(
  requirementId: string,
  includeReferences: boolean
) {
  return useQuery({
    queryKey: [
      ...designRequirementKeys.detail(requirementId),
      includeReferences,
    ],
    enabled: Boolean(requirementId),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const [references, deliverables] = await Promise.all([
          includeReferences
            ? supabase
                .from('design_references')
                .select('*')
                .eq('requirement_id', requirementId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from('design_deliverables')
            .select('*, design_assets(file_name)')
            .eq('requirement_id', requirementId)
            .is('deleted_at', null)
            .order('delivered_at', { ascending: false }),
        ])
        if (references.error) throw references.error
        if (deliverables.error) throw deliverables.error
        return {
          references: (references.data || []).map(mapSupabaseDesignReference),
          deliverables: (deliverables.data || []).map(
            mapSupabaseDesignDeliverable
          ),
        }
      }
      const filter = pb.filter('requirement = {:id}', { id: requirementId })
      const [references, deliverables] = await Promise.all([
        includeReferences
          ? pb
              .collection('design_references')
              .getFullList({ filter, sort: '-created' })
          : Promise.resolve([]),
        pb.collection('design_deliverables').getFullList({
          filter,
          sort: '-delivered_at',
          expand: 'asset',
        }),
      ])
      return {
        references: references.map((record): DesignReference => ({
          id: record.id,
          imageUrl: String(record.image_url || ''),
          source: String(record.source || ''),
          notes: String(record.notes || ''),
        })),
        deliverables: deliverables.map((record): DesignDeliverable => ({
          id: record.id,
          asset: String(record.asset || ''),
          assetName: String(record.expand?.asset?.file_name || '设计素材'),
          exportedSize: String(record.exported_size || ''),
          exportedFormat: String(record.exported_format || ''),
          checklistOk: Boolean(record.checklist_ok),
          deliveredAt: String(record.delivered_at || ''),
        })),
      }
    },
  })
}

function useRelationMutation(
  collection: 'design_references' | 'design_deliverables'
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        if (collection === 'design_references') {
          const { error } = await supabase.from('design_references').insert({
            requirement_id: String(data.requirement || ''),
            image_url: String(data.image_url || ''),
            source: data.source ? String(data.source) : null,
            notes: data.notes ? String(data.notes) : null,
          })
          if (error) throw error
          return
        }
        const { error } = await supabase.from('design_deliverables').insert({
          requirement_id: String(data.requirement || ''),
          asset_id: String(data.asset || ''),
          exported_size: String(data.exported_size || ''),
          exported_format: String(data.exported_format || ''),
          checklist_ok: Boolean(data.checklist_ok),
          delivered_at: String(data.delivered_at || ''),
        })
        if (error) throw error
        return
      }
      return pb.collection(collection).create(data)
    },
    onSuccess: (_, data) => {
      void queryClient.invalidateQueries({
        queryKey: designRequirementKeys.detail(String(data.requirement || '')),
      })
      toast.success(
        collection === 'design_references' ? '参考已添加' : '交付记录已添加'
      )
    },
  })
}

export const useCreateDesignReference = () =>
  useRelationMutation('design_references')
export const useCreateDesignDeliverable = () =>
  useRelationMutation('design_deliverables')

export function useApprovedDesignAssets(enabled: boolean) {
  return useQuery({
    queryKey: ['design', 'approved-assets'],
    enabled,
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('design_assets')
          .select('id,file_name')
          .eq('status', 'approved')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data || []).map((record) => ({
          id: record.id,
          file_name: record.file_name,
        }))
      }
      return pb.collection('design_assets').getFullList({
        filter: 'status = "approved"',
        sort: '-updated',
      })
    },
  })
}
