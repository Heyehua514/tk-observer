/** 当前用户 AI 记忆；只保存用户确认内容，Supabase-first。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getDataProvider } from '@/lib/data-provider'
import { getSupabaseClient } from '@/lib/supabase'

export type AiMemory = {
  id: string
  memoryType: string
  memoryKey: string
  memoryValue: string
  confidence: number
  source: string
  lastUsedAt?: string
}

const key = (ownerId: string) => ['ai-memory', ownerId] as const

type MemoryQuery = {
  from: (table: string) => MemoryBuilder
}

type MemoryBuilder = {
  select: (columns: string) => MemoryBuilder
  eq: (column: string, value: string) => MemoryBuilder
  is: (column: string, value: null) => MemoryBuilder
  order: (column: string, options: { ascending: boolean }) => MemoryBuilder
  limit: (count: number) => Promise<{ data: unknown[] | null; error: Error | null }>
  upsert: (payload: Record<string, unknown>) => Promise<{ error: Error | null }>
  update: (payload: Record<string, unknown>) => MemoryUpdateBuilder
}

type MemoryUpdateBuilder = {
  eq: (column: string, value: string) => MemoryUpdateBuilder
  then: Promise<{ error: Error | null }>['then']
}

function db() {
  return getSupabaseClient() as unknown as MemoryQuery
}

function mapMemory(row: Record<string, unknown>): AiMemory {
  return {
    id: String(row.id || ''),
    memoryType: String(row.memory_type || ''),
    memoryKey: String(row.memory_key || ''),
    memoryValue: String(row.memory_value || ''),
    confidence: Number(row.confidence || 0),
    source: String(row.source || 'manual'),
    lastUsedAt: row.last_used_at ? String(row.last_used_at) : undefined,
  }
}

export function useAiMemory() {
  const ownerId = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: key(ownerId),
    enabled: Boolean(ownerId),
    queryFn: async () => {
      if (getDataProvider() !== 'supabase') return []
      const { data, error } = await db()
        .from('ai_memory')
        .select('id,memory_type,memory_key,memory_value,confidence,source,last_used_at')
        .eq('owner_id', ownerId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data || []).map((row: unknown) =>
        mapMemory(row as Record<string, unknown>)
      )
    },
  })
  const save = useMutation({
    mutationFn: async (memory: Omit<AiMemory, 'id' | 'lastUsedAt'>) => {
      if (getDataProvider() !== 'supabase') return memory
      const { error } = await db()
        .from('ai_memory')
        .upsert({
          owner_id: ownerId,
          memory_type: memory.memoryType,
          memory_key: memory.memoryKey,
          memory_value: memory.memoryValue,
          confidence: memory.confidence,
          source: memory.source,
        })
      if (error) throw error
      return memory
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (getDataProvider() !== 'supabase') return
      const { error } = await db()
        .from('ai_memory')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('owner_id', ownerId)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  })
  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    save: save.mutateAsync,
    remove: remove.mutateAsync,
  }
}
