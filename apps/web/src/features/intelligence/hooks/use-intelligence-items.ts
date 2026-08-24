import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'
import { pb } from '@/lib/pocketbase'
import type { IntelligenceItem, IntelligenceFilters } from '../intelligence-model'

export const intelligenceKeys = {
  all: ['intelligence-items'] as const,
  list: (filters: IntelligenceFilters) => ['intelligence-items', filters] as const,
}

function mapRecord(record: Record<string, unknown>): IntelligenceItem {
  return {
    id: String(record.id || ''),
    title: String(record.title || ''),
    summary: String(record.summary || ''),
    sourceName: String(record.source_name || record.sourceName || ''),
    sourceType: (record.source_type || record.sourceType || 'manual') as IntelligenceItem['sourceType'],
    sourceUrl: String(record.source_url || record.sourceUrl || ''),
    capturedAt: String(record.captured_at || record.capturedAt || ''),
    region: String(record.region || ''),
    language: String(record.language || 'zh-CN'),
    topic: String(record.topic || ''),
    heatScore: Number(record.heat_score || record.heatScore || 0),
    confidence: Number(record.confidence || 0),
    dedupeKey: String(record.dedupe_key || record.dedupeKey || ''),
    workspaces: Array.isArray(record.workspaces) ? record.workspaces.map(String) : [],
    status: (record.status || 'unread') as IntelligenceItem['status'],
    createdBy: String(record.created_by || record.createdBy || ''),
    createdAt: String(record.created_at || record.createdAt || record.created || ''),
  }
}

export function useIntelligenceItems(filters: IntelligenceFilters) {
  return useQuery({
    queryKey: intelligenceKeys.list(filters),
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const client = getSupabaseClient()
        const { data, error } = await client
          .from('intelligence_items')
          .select('*')
          .is('deleted_at', null)
          .order('captured_at', { ascending: false })
        if (error) throw error
        return (data || []).map((record) => mapRecord(record as Record<string, unknown>))
      }
      const records = await pb.collection('intelligence_items').getFullList({ sort: '-captured_at' })
      return records.map((record) => mapRecord(record as unknown as Record<string, unknown>))
    },
  })
}

export function useUpdateIntelligenceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IntelligenceItem['status'] }) => {
      if (getDataProvider() !== 'supabase') throw new Error('当前数据服务只读，暂不支持更新情报')
      const { error } = await getSupabaseClient()
        .from('intelligence_items')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: intelligenceKeys.all }),
  })
}
