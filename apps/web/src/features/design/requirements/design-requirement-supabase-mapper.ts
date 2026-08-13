/** 设计需求 Supabase 映射层。 */
import type { Database } from '@/types/database.generated'
import type {
  DesignDeliverable,
  DesignReference,
  DesignRequirement,
  DesignRequirementInput,
} from './types'

type Tables = Database['public']['Tables']
type RequirementRow = Tables['design_requirements']['Row']
type ReferenceRow = Tables['design_references']['Row']
type DeliverableRow = Tables['design_deliverables']['Row'] & {
  design_assets?: { file_name?: unknown } | null
}
type PartialRecord<T> = Partial<T> & Record<string, unknown>

export function mapSupabaseDesignRequirement(
  record: PartialRecord<RequirementRow>
): DesignRequirement {
  return {
    id: String(record.id || ''),
    title: String(record.title || ''),
    description: String(record.description || ''),
    requester: String(record.requester_id || ''),
    targetSize: String(record.target_size || ''),
    usageScene: String(record.usage_scene || ''),
    copyContent: String(record.copy_content || ''),
    deliveryFormat: String(record.delivery_format || ''),
    referenceUrls: String(record.reference_urls || ''),
    status: (record.status || 'pending') as DesignRequirement['status'],
    priority: (record.priority || '中') as DesignRequirement['priority'],
    dueDate: String(record.due_date || ''),
    created: String(record.created_at || ''),
  }
}

export function serializeSupabaseDesignRequirement(
  input: DesignRequirementInput
) {
  return {
    title: input.title,
    description: input.description,
    requester_id: input.requester,
    target_size: input.targetSize,
    usage_scene: input.usageScene,
    copy_content: input.copyContent,
    delivery_format: input.deliveryFormat,
    reference_urls: input.referenceUrls || null,
    priority: input.priority,
    due_date: input.dueDate,
    status: 'pending',
  }
}

export function mapSupabaseDesignReference(
  record: PartialRecord<ReferenceRow>
): DesignReference {
  return {
    id: String(record.id || ''),
    imageUrl: String(record.image_url || ''),
    source: String(record.source || ''),
    notes: String(record.notes || ''),
  }
}

export function mapSupabaseDesignDeliverable(
  record: PartialRecord<DeliverableRow>
): DesignDeliverable {
  return {
    id: String(record.id || ''),
    asset: String(record.asset_id || ''),
    assetName: String(record.design_assets?.file_name || '设计素材'),
    exportedSize: String(record.exported_size || ''),
    exportedFormat: String(record.exported_format || ''),
    checklistOk: Boolean(record.checklist_ok),
    deliveredAt: String(record.delivered_at || ''),
  }
}
