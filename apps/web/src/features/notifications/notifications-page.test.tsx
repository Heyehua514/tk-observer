/** 通知中心页面测试；权限：当前用户只读；用途：验证分类筛选和空态。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { NotificationsPage } from './notifications-page'

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-mark-notification-read', () => ({
  useMarkNotificationRead: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  )
  return { ...actual, useNavigate: () => vi.fn() }
})

it('renders category filters and guided empty state', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPage />
    </QueryClientProvider>
  )
  await expect
    .element(screen.getByRole('heading', { name: '通知中心' }))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: /到期/ }))
    .toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /审核/ }))
  await expect
    .element(screen.getByText('这个分类暂时没有提醒'))
    .toBeInTheDocument()
})
