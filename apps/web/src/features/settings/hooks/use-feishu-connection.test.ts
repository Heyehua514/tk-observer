import { describe, expect, it } from 'vitest'
import { mapSupabaseFeishuConnection } from './use-feishu-connection'

describe('mapSupabaseFeishuConnection', () => {
  it('maps the redacted Supabase RPC row without token fields', () => {
    expect(
      mapSupabaseFeishuConnection({
        connected: true,
        connected_at: '2026-08-20T08:00:00.000Z',
        sync_enabled: true,
      })
    ).toEqual({
      connected: true,
      connectedAt: '2026-08-20T08:00:00.000Z',
      syncEnabled: true,
    })
  })

  it('keeps an absent Supabase connection in the disconnected state', () => {
    expect(mapSupabaseFeishuConnection(null)).toEqual({
      connected: false,
      connectedAt: '',
      syncEnabled: true,
    })
  })
})
