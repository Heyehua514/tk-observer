import { describe, expect, it } from 'vitest'
import { clientIndustryLabels, clientIndustryOptions } from './client-options'

describe('clientIndustryOptions', () => {
  it('includes newly appended business-service industries', () => {
    expect(clientIndustryOptions.map(([value]) => value)).toContain('ai_tool')
    expect(clientIndustryOptions.map(([value]) => value)).toContain(
      'creator_tool'
    )
    expect(clientIndustryOptions.map(([value]) => value)).toContain('erp')
    expect(clientIndustryOptions.map(([value]) => value)).toContain('payment')
    expect(clientIndustryOptions.map(([value]) => value)).toContain(
      'finance_tax'
    )
    expect(clientIndustryLabels.ai_tool).toBe('AI工具服务商')
  })
})
