import { describe, expect, it } from 'vitest'
import { calculateActivityMetrics } from './activity-metrics'

describe('calculateActivityMetrics', () => {
  it('aggregates workflow and financial outcomes deterministically', () => {
    expect(
      calculateActivityMetrics(
        [
          { id: '1', status: 'done' },
          { id: '2', status: 'todo' },
        ],
        [
          { id: '1', status: 'confirmed' },
          { id: '2', status: 'pending' },
        ],
        [
          { id: '1', stage: 'signed', amount: 120000 },
          { id: '2', stage: 'intent', amount: 50000 },
        ],
        [
          { id: '1', type: 'income', amount: 180000 },
          { id: '2', type: 'expense', amount: 70000 },
        ]
      )
    ).toEqual({
      taskTotal: 2,
      taskDone: 1,
      confirmedRegistrations: 1,
      signedSponsorship: 120000,
      income: 180000,
      expense: 70000,
      profit: 110000,
    })
  })
})
