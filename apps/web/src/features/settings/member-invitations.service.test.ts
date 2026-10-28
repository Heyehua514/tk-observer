import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  revokeMemberInvitation,
  saveMemberInvitation,
} from './member-invitations'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getDataProvider: vi.fn(() => 'supabase'),
}))

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: mocks.getDataProvider,
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({ from: mocks.from }),
}))

type QueryResult = { data: unknown; error: unknown }

function queryBuilder(result: QueryResult) {
  const builder = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    eq: vi.fn(),
    gt: vi.fn(),
    maybeSingle: vi.fn(async () => result),
  }
  builder.select.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.gt.mockReturnValue(builder)
  return builder
}

const invitedRow = {
  id: 'invite-1',
  email: 'design@example.com',
  name: '孙铭洋',
  role: 'design',
  status: 'invited',
  expires_at: '2026-11-04T00:00:00.000Z',
  accepted_at: null,
  created_at: '2026-10-28T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getDataProvider.mockReturnValue('supabase')
})

describe('member invitation service transitions', () => {
  it('never overwrites an accepted invitation', async () => {
    const lookup = queryBuilder({
      data: { id: 'invite-1', status: 'accepted' },
      error: null,
    })
    mocks.from.mockReturnValueOnce(lookup)

    await expect(
      saveMemberInvitation(
        {
          email: 'Design@Example.com',
          name: '孙铭洋',
          role: 'design',
        },
        'owner-1'
      )
    ).rejects.toThrow('该邮箱已完成邀请，不能重复邀请')

    expect(mocks.from).toHaveBeenCalledTimes(1)
    expect(lookup.update).not.toHaveBeenCalled()
  })

  it('updates an existing non-accepted invitation with an optimistic status guard', async () => {
    const lookup = queryBuilder({
      data: { id: 'invite-1', status: 'revoked' },
      error: null,
    })
    const mutation = queryBuilder({ data: invitedRow, error: null })
    mocks.from.mockReturnValueOnce(lookup).mockReturnValueOnce(mutation)

    const invitation = await saveMemberInvitation(
      {
        email: ' Design@Example.com ',
        name: ' 孙铭洋 ',
        role: 'design',
      },
      'owner-1'
    )

    expect(invitation).toMatchObject({
      id: 'invite-1',
      email: 'design@example.com',
      role: 'design',
      status: 'invited',
    })
    expect(mutation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'design@example.com',
        name: '孙铭洋',
        role: 'design',
        status: 'invited',
        invited_by: 'owner-1',
        accepted_at: null,
      })
    )
    expect(mutation.eq).toHaveBeenNthCalledWith(1, 'id', 'invite-1')
    expect(mutation.eq).toHaveBeenNthCalledWith(2, 'status', 'revoked')
  })

  it('fails closed when an invitation changes state during save', async () => {
    const lookup = queryBuilder({
      data: { id: 'invite-1', status: 'invited' },
      error: null,
    })
    const mutation = queryBuilder({ data: null, error: null })
    mocks.from.mockReturnValueOnce(lookup).mockReturnValueOnce(mutation)

    await expect(
      saveMemberInvitation(
        {
          email: 'design@example.com',
          name: '孙铭洋',
          role: 'design',
        },
        'owner-1'
      )
    ).rejects.toThrow('邀请状态已变化，请刷新后重试')
  })

  it('revokes only an invitation that is still pending use', async () => {
    const mutation = queryBuilder({
      data: { ...invitedRow, status: 'revoked' },
      error: null,
    })
    mocks.from.mockReturnValueOnce(mutation)

    const invitation = await revokeMemberInvitation('invite-1')

    expect(invitation.status).toBe('revoked')
    expect(mutation.update).toHaveBeenCalledWith({
      status: 'revoked',
      accepted_at: null,
    })
    expect(mutation.eq).toHaveBeenNthCalledWith(1, 'id', 'invite-1')
    expect(mutation.eq).toHaveBeenNthCalledWith(2, 'status', 'invited')
    expect(mutation.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
  })

  it('rejects a stale revoke when the invitation was accepted concurrently', async () => {
    const mutation = queryBuilder({ data: null, error: null })
    mocks.from.mockReturnValueOnce(mutation)

    await expect(revokeMemberInvitation('invite-1')).rejects.toThrow(
      '仅待使用邀请可撤销，请刷新后重试'
    )
  })

  it('rejects malformed invitation input before touching the database', async () => {
    await expect(
      saveMemberInvitation(
        { email: 'not-an-email', name: '', role: 'design' },
        'owner-1'
      )
    ).rejects.toThrow('邀请信息无效')
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
