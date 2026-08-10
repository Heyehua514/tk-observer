import { describe, expect, it } from 'vitest'
import { canTransitionRequirement } from './requirement-rules'

describe('design requirement transitions', () => {
  it('supports the normal delivery flow', () => {
    expect(canTransitionRequirement('pending', 'in_progress')).toBe(true)
    expect(canTransitionRequirement('in_progress', 'delivered')).toBe(true)
  })

  it('supports revision feedback without skipping production', () => {
    expect(canTransitionRequirement('delivered', 'revised')).toBe(true)
    expect(canTransitionRequirement('revised', 'in_progress')).toBe(true)
    expect(canTransitionRequirement('revised', 'delivered')).toBe(false)
  })
})
