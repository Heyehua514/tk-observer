import { describe, expect, it } from 'vitest'
import { getRoleAvatarPresentation } from './role-avatar-utils'

describe('getRoleAvatarPresentation', () => {
  it('uses the fixed member color and the final two name characters', () => {
    expect(getRoleAvatarPresentation('董雨辰', 'business')).toEqual({
      label: '雨辰',
      color: '#8B5CF6',
    })
  })

  it('falls back to the role color for a test account', () => {
    expect(getRoleAvatarPresentation('杨振康', 'business')).toEqual({
      label: '振康',
      color: '#8B5CF6',
    })
  })
})
