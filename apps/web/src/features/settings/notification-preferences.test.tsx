/** 通知偏好页面测试；权限：当前用户只读；用途：验证加载失败时可重试。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { NotificationPreferencesPage } from './notification-preferences'

const refetch = vi.fn()

vi.mock('./hooks/use-notification-preferences', () => ({
  useNotificationPreferences: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch,
    save: vi.fn(),
    isSaving: false,
  }),
}))

it('shows a retry action when notification preferences fail to load', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationPreferencesPage />
    </QueryClientProvider>
  )

  await expect
    .element(screen.getByText('通知偏好加载失败'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '重新加载' }))
    .toBeInTheDocument()
})
