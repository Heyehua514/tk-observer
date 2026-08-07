import { expect, it } from 'vitest'
import { formatCny, opportunityCreateInput } from './opportunity-amount'

it('preserves the amount a business user enters across save and display', () => {
  const payload = opportunityCreateInput({
    title: '品牌年度合作',
    client: 'client-1',
    amount: '10000.50',
  })

  expect(payload).not.toBeNull()
  expect(formatCny(payload!.amount)).toBe('¥10,000.50')
})
