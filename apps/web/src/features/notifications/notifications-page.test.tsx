/** 通知中心页面测试；权限：当前用户只读；用途：验证分类筛选和空态。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { NotificationsPage } from './notifications-page'

const notifications = vi.hoisted(() => [
  {
    id: 'n-1',
    type: 'deadline',
    title: '任务即将到期',
    content: '活动物料需要今天完成',
    created: '2026-08-21T02:00:00.000Z',
    isRead: false,
    link: '/business',
  },
  {
    id: 'n-2',
    type: 'comment',
    title: '客户跟进提醒',
    content: '请补充本周跟进结果',
    created: '2026-08-20T02:00:00.000Z',
    isRead: true,
    link: '/business',
  },
])

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: notifications,
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
    .element(screen.getByRole('button', { name: '到期 1', exact: true }))
    .toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /审核/ }))
  await expect
    .element(screen.getByText('这个分类暂时没有提醒'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '查看全部通知' }))
    .toBeInTheDocument()
})

it('groups notifications by Beijing day and marks unread items clearly', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPage />
    </QueryClientProvider>
  )
  await expect
    .element(screen.getByRole('heading', { name: '2026年8月21日' }))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('heading', { name: '2026年8月20日' }))
    .toBeInTheDocument()
  await expect.element(screen.getByLabelText('未读')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '全部 2', exact: true }))
    .toHaveAttribute('aria-pressed', 'true')
})
