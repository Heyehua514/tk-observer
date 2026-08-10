/** 设计需求、参考和交付记录的数据 hooks。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import type { RequirementStatus } from './requirement-rules'
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
    queryFn: async () =>
      (
        await pb.collection('design_requirements').getFullList({
          sort: 'due_date',
          filter:
            status === 'all' ? '' : pb.filter('status = {:status}', { status }),
        })
      ).map(mapRequirement),
  })
}

export function useCreateDesignRequirement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DesignRequirementInput) =>
      pb.collection('design_requirements').create({
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
      }),
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
    mutationFn: ({ id, status }: { id: string; status: RequirementStatus }) =>
      pb.collection('design_requirements').update(id, { status }),
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
    mutationFn: (data: Record<string, unknown>) =>
      pb.collection(collection).create(data),
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
    queryFn: () =>
      pb.collection('design_assets').getFullList({
        filter: 'status = "approved"',
        sort: '-updated',
      }),
  })
}
