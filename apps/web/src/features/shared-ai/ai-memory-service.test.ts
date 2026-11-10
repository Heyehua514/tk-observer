import type { Database } from '@/types/database.generated'
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import {
  type AiMemoryInput,
  loadAiMemories,
  removeAiMemory,
  saveAiMemory,
} from './ai-memory-service'

const owner = '95000000-0000-0000-0000-000000000001'
const memory: AiMemoryInput = {
  memoryType: 'accepted_ai',
  memoryKey: 'business:analysis',
  memoryValue: 'Follow up',
  confidence: 0.7,
  source: 'accepted_ai',
}
let clientSequence = 0
function setup(
  body: unknown = { id: 'memory-1' },
  status = 200,
  provider = 'supabase'
) {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  const client = createClient<Database>(
    'https://memory.example.test',
    'test-anon-key',
    {
      auth: {
        storageKey: `ai-memory-service-test-${++clientSequence}`,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch },
    }
  )
  return {
    fetch,
    deps: { getClient: () => client, getProvider: () => provider },
  }
}

describe('AI memory persistence contract', () => {
  it('upserts the natural key and restores deleted rows with a returned record', async () => {
    const { fetch, deps } = setup()
    await expect(saveAiMemory(owner, memory, deps)).resolves.toEqual(memory)
    const [url, init] = fetch.mock.calls[0]
    expect(new URL(String(url)).searchParams.get('on_conflict')).toBe(
      'owner_id,memory_key'
    )
    expect(new Headers(init?.headers).get('prefer')).toContain(
      'resolution=merge-duplicates'
    )
    expect(JSON.parse(String(init?.body))).toEqual({
      owner_id: owner,
      memory_type: 'accepted_ai',
      memory_key: 'business:analysis',
      memory_value: 'Follow up',
      confidence: 0.7,
      source: 'accepted_ai',
      deleted_at: null,
    })
  })

  it('rejects missing authentication and unsupported storage before any write', async () => {
    const { fetch, deps } = setup()
    await expect(saveAiMemory('', memory, deps)).rejects.toThrow(
      'AI_MEMORY_AUTH_REQUIRED'
    )
    await expect(
      saveAiMemory(owner, memory, { ...deps, getProvider: () => 'pocketbase' })
    ).rejects.toThrow('AI_MEMORY_STORAGE_UNAVAILABLE')
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    { memoryType: '' },
    { memoryType: 'a'.repeat(41) },
    { memoryKey: ' ' },
    { memoryKey: 'a'.repeat(121) },
    { memoryValue: '' },
    { memoryValue: 'a'.repeat(2001) },
    { confidence: -0.1 },
    { confidence: 1.1 },
    { confidence: NaN },
    { source: 'unknown' },
  ])('rejects invalid fields before sending: %j', async (patch) => {
    const { fetch, deps } = setup()
    await expect(
      saveAiMemory(owner, { ...memory, ...patch }, deps)
    ).rejects.toThrow('AI_MEMORY_INVALID_INPUT')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('accepts Unicode characters up to the PostgreSQL character limit', async () => {
    const { deps } = setup()
    await expect(
      saveAiMemory(owner, { ...memory, memoryValue: '😀'.repeat(2000) }, deps)
    ).resolves.toBeDefined()
  })

  it('propagates storage errors instead of announcing success', async () => {
    const { deps } = setup({ message: 'permission denied', code: '42501' }, 403)
    await expect(saveAiMemory(owner, memory, deps)).rejects.toMatchObject({
      code: '42501',
    })
  })

  it('requires a persisted row before reporting success', async () => {
    const { deps } = setup(null)
    await expect(saveAiMemory(owner, memory, deps)).rejects.toThrow(
      'AI_MEMORY_WRITE_UNCONFIRMED'
    )
  })

  it('reads only the current owner active rows and maps database fields', async () => {
    const { fetch, deps } = setup([
      {
        id: 'memory-1',
        memory_type: 'accepted_ai',
        memory_key: 'business:analysis',
        memory_value: 'Follow up',
        confidence: 0.7,
        source: 'accepted_ai',
        last_used_at: null,
      },
    ])
    await expect(loadAiMemories(owner, deps)).resolves.toEqual([
      { ...memory, id: 'memory-1', lastUsedAt: undefined },
    ])
    const params = new URL(String(fetch.mock.calls[0][0])).searchParams
    expect(params.get('owner_id')).toBe(`eq.${owner}`)
    expect(params.get('deleted_at')).toBe('is.null')
    expect(params.get('limit')).toBe('30')
    expect(params.get('order')).toBe('updated_at.desc')
  })

  it('never turns a read failure into an empty memory list', async () => {
    const { deps } = setup({ message: 'denied', code: '42501' }, 403)
    await expect(loadAiMemories(owner, deps)).rejects.toMatchObject({
      code: '42501',
    })
  })

  it('soft deletes only the selected owner and id', async () => {
    const { fetch, deps } = setup()
    await removeAiMemory(owner, 'memory-1', deps)
    const [url, init] = fetch.mock.calls[0]
    const params = new URL(String(url)).searchParams
    expect(params.get('owner_id')).toBe(`eq.${owner}`)
    expect(params.get('id')).toBe('eq.memory-1')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body)).deleted_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T/
    )
  })

  it('does not report deletion when RLS filters out the row', async () => {
    const { deps } = setup(
      { message: 'Cannot coerce to single JSON', code: 'PGRST116' },
      406
    )
    await expect(
      removeAiMemory(owner, 'other-memory', deps)
    ).rejects.toMatchObject({ code: 'PGRST116' })
  })
})
