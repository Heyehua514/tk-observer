/** 通知中心深链导航测试；权限：当前用户只读并标记本人通知。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { NotificationsPage } from './notifications-page'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  markRead: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn() },
}))

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: [
      {
        id: 'notification-result',
        recipient: 'designer-1',
        type: 'design_review',
        title: '设计稿已驳回',
        content: '请根据驳回理由修改后重新提交。',
        created: '2026-10-29T02:00:00.000Z',
        isRead: false,
        link: '/design',
        recordType: 'design_asset',
        recordId: 'asset-42',
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-mark-notification-read', () => ({
  useMarkNotificationRead: () => ({
    mutate: vi.fn(),
    mutateAsync: mocks.markRead,
    isPending: false,
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  )
  return { ...actual, useNavigate: () => mocks.navigate }
})

beforeEach(() => {
  mocks.navigate.mockReset()
  mocks.markRead.mockReset()
  mocks.markRead.mockResolvedValue(undefined)
})

it('navigates a review result to the exact design asset', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPage />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('button', { name: /设计稿已驳回/ }))

  await vi.waitFor(() => {
    expect(mocks.markRead).toHaveBeenCalledWith(['notification-result'])
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: '/design',
      search: {
        recordType: 'design_asset',
        recordId: 'asset-42',
      },
      replace: true,
    })
  })
})

it('opens the exact target when marking the notification read fails', async () => {
  mocks.markRead.mockRejectedValueOnce(new Error('offline'))
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPage />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('button', { name: /设计稿已驳回/ }))

  await vi.waitFor(() => {
    expect(mocks.markRead).toHaveBeenCalledWith(['notification-result'])
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: '/design',
      search: {
        recordType: 'design_asset',
        recordId: 'asset-42',
      },
      replace: true,
    })
  })
})
