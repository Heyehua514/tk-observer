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
export type AiMemoryInput = Omit<AiMemory, 'id' | 'lastUsedAt'>
type Dependencies = {
  getClient: () => Pick<ReturnType<typeof getSupabaseClient>, 'from'>
  getProvider: () => string
}
const defaults: Dependencies = {
  getClient: getSupabaseClient,
  getProvider: getDataProvider,
}

function requireStorage(ownerId: string, deps: Dependencies) {
  if (!ownerId) throw new Error('AI_MEMORY_AUTH_REQUIRED')
  if (deps.getProvider() !== 'supabase')
    throw new Error('AI_MEMORY_STORAGE_UNAVAILABLE')
  return deps.getClient()
}

function bounded(value: string, max: number) {
  return value.trim().length > 0 && Array.from(value).length <= max
}

export async function saveAiMemory(
  ownerId: string,
  memory: AiMemoryInput,
  deps = defaults
) {
  const client = requireStorage(ownerId, deps)
  if (
    !bounded(memory.memoryType, 40) ||
    !bounded(memory.memoryKey, 120) ||
    !bounded(memory.memoryValue, 2000) ||
    !Number.isFinite(memory.confidence) ||
    memory.confidence < 0 ||
    memory.confidence > 1 ||
    !['manual', 'accepted_ai', 'review', 'auto_cut_diagnosis'].includes(
      memory.source
    )
  )
    throw new Error('AI_MEMORY_INVALID_INPUT')
  const { data, error } = await client
    .from('ai_memory')
    .upsert(
      {
        owner_id: ownerId,
        memory_type: memory.memoryType,
        memory_key: memory.memoryKey,
        memory_value: memory.memoryValue,
        confidence: memory.confidence,
        source: memory.source,
        deleted_at: null,
      },
      { onConflict: 'owner_id,memory_key' }
    )
    .select('id')
    .single()
  if (error) throw error
  if (!data?.id) throw new Error('AI_MEMORY_WRITE_UNCONFIRMED')
  return memory
}

export async function removeAiMemory(
  ownerId: string,
  id: string,
  deps = defaults
) {
  const client = requireStorage(ownerId, deps)
  const { data, error } = await client
    .from('ai_memory')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('id')
    .single()
  if (error) throw error
  if (!data?.id) throw new Error('AI_MEMORY_WRITE_UNCONFIRMED')
}

export async function loadAiMemories(
  ownerId: string,
  deps = defaults
): Promise<AiMemory[]> {
  const { data, error } = await requireStorage(ownerId, deps)
    .from('ai_memory')
    .select(
      'id,memory_type,memory_key,memory_value,confidence,source,last_used_at'
    )
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data || []).map((row) => ({
    id: row.id,
    memoryType: row.memory_type,
    memoryKey: row.memory_key,
    memoryValue: row.memory_value,
    confidence: row.confidence,
    source: row.source,
    lastUsedAt: row.last_used_at ?? undefined,
  }))
}
