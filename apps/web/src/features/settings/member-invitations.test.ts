import { describe, expect, it } from 'vitest'
import {
  getEffectiveInvitationStatus,
  getInvitationActions,
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
  it('maps every assignable invitation role and keeps owner out', () => {
    for (const role of invitationRoles) {
      expect(mapMemberInvitation({ ...row, role })).toMatchObject({ role })
    }
    expect(invitationRoles).not.toContain('owner')
    expect(mapMemberInvitation({ ...row, role: 'owner' })).toBeNull()
  })

  it('maps invitation rows and normalizes the stored email', () => {
    expect(
      mapMemberInvitation({ ...row, email: ' Member@Example.COM ' })
    ).toMatchObject({
      id: 'invite-1',
      email: 'member@example.com',
      name: '新成员',
      role: 'business',
      status: 'invited',
    })
  })

  it('derives expiry without mutating the stored status', () => {
    expect(
      getEffectiveInvitationStatus(
        { status: 'invited', expiresAt: row.expires_at },
        new Date('2026-11-04T00:00:00.000Z').getTime()
      )
    ).toBe('expired')
    expect(
      getEffectiveInvitationStatus(
        { status: 'invited', expiresAt: row.expires_at },
        new Date(row.expires_at).getTime()
      )
    ).toBe('expired')
    expect(
      getEffectiveInvitationStatus(
        { status: 'invited', expiresAt: 'not-a-date' },
        Date.now()
      )
    ).toBe('expired')
    expect(row.status).toBe('invited')
  })

  it('keeps UI actions aligned with the effective invitation state', () => {
    const now = new Date('2026-10-28T00:00:00.000Z').getTime()
    expect(
      getInvitationActions(
        { status: 'invited', expiresAt: '2026-11-03T00:00:00.000Z' },
        now
      )
    ).toEqual({ canRevoke: true, canReinvite: false })
    expect(
      getInvitationActions(
        { status: 'invited', expiresAt: '2026-10-27T00:00:00.000Z' },
        now
      )
    ).toEqual({ canRevoke: false, canReinvite: true })
    expect(
      getInvitationActions(
        { status: 'revoked', expiresAt: '2026-11-03T00:00:00.000Z' },
        now
      )
    ).toEqual({ canRevoke: false, canReinvite: true })
    expect(
      getInvitationActions(
        { status: 'accepted', expiresAt: '2026-11-03T00:00:00.000Z' },
        now
      )
    ).toEqual({ canRevoke: false, canReinvite: false })
  })

  it('normalizes invitation emails and rejects unrepresentable statuses', () => {
    expect(normalizeInvitationEmail('  Member@Example.COM ')).toBe(
      'member@example.com'
    )
    expect(mapMemberInvitation({ ...row, status: 'unknown' })).toBeNull()
  })
})
