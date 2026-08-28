import { describe, expect, it } from 'vitest'
import { combineLocalDateTime } from './publish-schedule-model'

describe('combineLocalDateTime', () => {
  it('combines a selected date and time for the existing form contract', () => {
    expect(combineLocalDateTime('2026-08-21', '18:30')).toBe('2026-08-21T18:30')
  })

  it('uses the planned default time when the time is empty', () => {
    expect(combineLocalDateTime('2026-08-21', '')).toBe('2026-08-21T09:00')
  })

  it('clears the value when no date is selected', () => {
    expect(combineLocalDateTime('', '18:30')).toBe('')
  })
})
