import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { NotificationBell } from './notification-bell'

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: [],
    isLoading: false,
    isError: true,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-mark-notification-read', () => ({
  useMarkNotificationRead: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (sel: (s: { user: { id: string } }) => unknown) => sel({ user: { id: 'u1' } }),
}))

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

it('shows a retry action when notifications fail to load', async () => {
  const screen = await render(
    <QueryClientProvider client={qc}>
      <NotificationBell />
    </QueryClientProvider>
  )
  await userEvent.click(screen.getByRole('button', { name: '通知' }))
  await expect.element(screen.getByText('通知加载失败')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '重新加载' }))
    .toBeInTheDocument()
})
