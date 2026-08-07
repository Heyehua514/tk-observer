import { describe, expect, it } from 'vitest'
import { formatBeijingClock } from './beijing-time'

describe('formatBeijingClock', () => {
  it('formats an instant in Asia/Shanghai instead of the browser timezone', () => {
    expect(formatBeijingClock(new Date('2026-08-06T01:05:00Z'))).toMatch(
      /2026.*8.*6.*09:05/
    )
  })
})
