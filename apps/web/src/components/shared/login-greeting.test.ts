import { describe, expect, it } from 'vitest'
import { getGreetingForBeijingHour } from './greeting-utils'

describe('getGreetingForBeijingHour', () => {
  it.each([
    [5, '早上好，打工人'],
    [11, '中午好，打工人'],
    [17, '晚上好，打工人'],
    [23, '晚上好，打工人'],
  ])('maps Beijing hour %i to %s', (hour, expected) => {
    expect(getGreetingForBeijingHour(hour)).toBe(expected)
  })
})
