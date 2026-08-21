import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { NotificationsPage } from './notifications-page'

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: [
      {
        id: 'eval-notification',
        type: 'design_review',
        title: '设计稿待审核',
        content: '请查看设计稿并给出审核结果',
        created: '2026-08-21T03:00:00.000Z',
        isRead: false,
        link: '/design',
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

it('keeps notification center readable on a narrow viewport', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPage />
    </QueryClientProvider>
  )
  await expect
    .element(screen.getByRole('heading', { name: '通知中心' }))
    .toBeInTheDocument()
  await expect.element(screen.getByText('设计稿待审核')).toBeInTheDocument()

  const overflowing = [...document.querySelectorAll<HTMLElement>('*')].filter(
    (element) => element.scrollWidth > element.clientWidth
  )
  expect(overflowing).toEqual([])
})
