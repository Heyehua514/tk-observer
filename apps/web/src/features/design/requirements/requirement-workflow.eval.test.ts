import { describe, expect, it } from 'vitest'
import { requirementStatusLabels } from './requirement-labels'
import { canTransitionRequirement } from './requirement-rules'

describe('design requirement workflow eval', () => {
  it('keeps every operational state visible and the revision loop complete', () => {
    expect(Object.values(requirementStatusLabels)).toEqual([
      '待接单',
      '制作中',
      '已交付',
      '修改中',
    ])
    expect(canTransitionRequirement('delivered', 'revised')).toBe(true)
    expect(canTransitionRequirement('revised', 'in_progress')).toBe(true)
    expect(canTransitionRequirement('in_progress', 'delivered')).toBe(true)
  })
})
