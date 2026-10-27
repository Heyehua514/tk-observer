import { describe, expect, it } from 'vitest'
import {
  getEffectiveInvitationStatus,
  invitationRoles,
  mapMemberInvitation,
  normalizeInvitationEmail,
} from './member-invitations'

const row = {
  id: 'invite-1',
  email: 'member@example.com',
  name: '新成员',
  role: 'business',
  status: 'invited',
  expires_at: '2026-11-03T00:00:00.000Z',
  accepted_at: null,
  created_at: '2026-10-27T00:00:00.000Z',
}

describe('member invitation contract', () => {
  it('maps invitation rows and keeps owner out of assignable roles', () => {
    expect(mapMemberInvitation(row)).toMatchObject({
      id: 'invite-1',
      email: 'member@example.com',
      role: 'business',
      status: 'invited',
    })
    expect(invitationRoles).not.toContain('owner')
  })

  it('derives expiry without mutating the stored status', () => {
    expect(
      getEffectiveInvitationStatus(
        { status: 'invited', expiresAt: row.expires_at },
        new Date('2026-11-04T00:00:00.000Z').getTime()
      )
    ).toBe('expired')
    expect(row.status).toBe('invited')
  })

  it('normalizes invitation emails and rejects invalid roles', () => {
    expect(normalizeInvitationEmail('  Member@Example.COM ')).toBe(
      'member@example.com'
    )
    expect(mapMemberInvitation({ ...row, role: 'owner' })).toBeNull()
  })
})
