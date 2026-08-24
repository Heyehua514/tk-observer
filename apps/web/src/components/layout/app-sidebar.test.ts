import { describe, expect, it } from 'vitest'
import { canSeeNavigationItem } from './app-sidebar-model'

describe('app sidebar navigation visibility', () => {
  it('shows the shared intelligence center to every authenticated role', () => {
    const item = { role: 'business' as const, to: '/intelligence' }

    expect(canSeeNavigationItem('boss', item)).toBe(true)
    expect(canSeeNavigationItem('business', item)).toBe(true)
    expect(canSeeNavigationItem('market', item)).toBe(true)
    expect(canSeeNavigationItem('design', item)).toBe(true)
    expect(canSeeNavigationItem('editing', item)).toBe(true)
  })

  it('keeps role-specific workbenches restricted', () => {
    expect(
      canSeeNavigationItem('market', {
        role: 'business',
        to: '/business',
      })
    ).toBe(false)
    expect(
      canSeeNavigationItem('boss', {
        role: 'business',
        to: '/business',
      })
    ).toBe(true)
  })
})
