import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemberAccessCard } from './member-access-card'

const state = vi.hoisted(() => ({
  auth: {
    user: {
      id: 'owner-1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner',
    },
  },
  invitations: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
    isError: false,
    isSaving: false,
    refetch: vi.fn(),
    save: vi.fn(),
    revoke: vi.fn(),
  },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (value: typeof state.auth) => unknown) =>
    selector(state.auth),
}))

vi.mock('@/lib/data-provider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/data-provider')>()),
  getDataProvider: () => 'supabase',
}))

vi.mock('../hooks/use-member-invitations', () => ({
  useMemberInvitations: () => state.invitations,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const baseInvitation = {
  name: '孙铭洋',
  email: 'design@example.com',
  role: 'design',
  expiresAt: '2099-11-03T00:00:00.000Z',
  acceptedAt: null,
  createdAt: '2026-10-28T00:00:00.000Z',
}

beforeEach(() => {
  state.auth.user.role = 'owner'
  state.invitations.data = []
  state.invitations.isSaving = false
  vi.clearAllMocks()
})

describe('member access card', () => {
  it('shows the invitation lifecycle actions that are valid for each state', async () => {
    state.invitations.data = [
      { ...baseInvitation, id: 'invite-1', status: 'invited' },
      {
        ...baseInvitation,
        id: 'invite-2',
        name: '周可',
        email: 'editing@example.com',
        role: 'editing',
        status: 'expired',
        expiresAt: '2020-01-01T00:00:00.000Z',
      },
      {
        ...baseInvitation,
        id: 'invite-3',
        name: '李然',
        email: 'business@example.com',
        role: 'business',
        status: 'accepted',
        acceptedAt: '2026-10-28T01:00:00.000Z',
      },
    ]

    const screen = await render(<MemberAccessCard />)

    await expect.element(screen.getByText('成员准入与邀请')).toBeInTheDocument()
    await expect.element(screen.getByText('撤销')).toBeInTheDocument()
    await expect.element(screen.getByText('重新邀请')).toBeInTheDocument()
    await expect.element(screen.getByText('已加入')).toBeInTheDocument()

    await screen.getByRole('button', { name: '撤销' }).click()
    expect(state.invitations.revoke).toHaveBeenCalledWith('invite-1')

    await screen.getByRole('button', { name: '重新邀请' }).click()
    expect(state.invitations.save).toHaveBeenCalledWith({
      input: {
        name: '周可',
        email: 'editing@example.com',
        role: 'editing',
      },
      invitedBy: 'owner-1',
    })
  })

  it('does not expose member admission controls to non-owner roles', async () => {
    state.auth.user.role = 'design'

    const screen = await render(<MemberAccessCard />)

    await expect
      .element(screen.getByText('成员准入与邀请'))
      .not.toBeInTheDocument()
  })
})
