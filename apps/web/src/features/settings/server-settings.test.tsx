/** 系统设置页文案自检；明确当前配置项是 PocketBase 回退服务。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ServerSettings } from './server-settings'

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  )
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('@/lib/pocketbase', () => ({
  getStoredServerUrl: () => 'http://127.0.0.1:8090',
  setPocketBaseUrl: vi.fn(),
}))

it('labels the server setting as the PocketBase fallback endpoint', async () => {
  const queryClient = new QueryClient()
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ServerSettings />
    </QueryClientProvider>
  )

  await expect
    .element(screen.getByText('配置桌面端连接的 PocketBase 回退服务。'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByText('PocketBase 回退服务器'))
    .toBeInTheDocument()
  await expect.element(screen.getByText('客户端更新')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: '网页端已自动更新' }))
    .toBeDisabled()
})
