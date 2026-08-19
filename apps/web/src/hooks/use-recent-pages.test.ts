import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useRecentPages } from './use-recent-pages'

const sessions: Record<string, string> = {}

const locationMock = vi.fn(() => ({ pathname: '' }))

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => locationMock(),
}))

beforeEach(() => {
  Object.keys(sessions).forEach((k) => delete sessions[k])
  // Reset stored key handled inside module cache; we override via window stub below
  locationMock.mockReturnValue({ pathname: '' })
})

describe('useRecentPages', () => {
  it('does not include the current page in the recent list', async () => {
    locationMock.mockReturnValue({ pathname: '/business' })
    const { result } = await renderHook(() => useRecentPages())
    expect(result.current).not.toContain('/business')
  })
})
