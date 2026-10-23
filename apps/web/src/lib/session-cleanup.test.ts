import { describe, expect, it, vi } from 'vitest'
import { clearClientSession } from './session-cleanup'

describe('client session cleanup', () => {
  it('clears both query cache and every sessionStorage entry', () => {
    const queryClear = vi.fn()
    const entries = new Map([
      ['tk-observer-user-session', 'stale-user'],
      ['tk-observer-access-denied', 'true'],
    ])
    const storage = {
      clear: vi.fn(() => entries.clear()),
    }

    clearClientSession({ clear: queryClear }, storage)

    expect(queryClear).toHaveBeenCalledOnce()
    expect(storage.clear).toHaveBeenCalledOnce()
    expect(entries.size).toBe(0)
  })
})
