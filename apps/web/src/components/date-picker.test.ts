import { describe, expect, it } from 'vitest'
import { isDatePickerDateDisabled } from './date-picker-model'

describe('isDatePickerDateDisabled', () => {
  it('keeps future dates disabled for history fields by default', () => {
    expect(isDatePickerDateDisabled(new Date('2099-01-01'))).toBe(true)
  })

  it('allows future dates for planned business fields', () => {
    expect(isDatePickerDateDisabled(new Date('2099-01-01'), true)).toBe(false)
  })

  it('keeps dates before 1900 disabled in both modes', () => {
    expect(isDatePickerDateDisabled(new Date('1899-12-31'), true)).toBe(true)
  })
})
