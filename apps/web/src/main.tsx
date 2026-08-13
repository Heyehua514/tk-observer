/** 应用入口：查询缓存、路由、主题与全局错误处理。 */
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ClientResponseError } from 'pocketbase'
import { toast } from 'sonner'
import { logout } from '@/lib/auth'
import { getRequestErrorMessage } from '@/lib/errors'
import { DirectionProvider } from '@/context/direction-provider'
import { FontProvider } from '@/context/font-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { registerServiceWorker } from '@/lib/register-sw'
import { routeTree } from './routeTree.gen'
import './styles/index.css'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        !(
          error instanceof ClientResponseError &&
          [400, 401, 403, 404].includes(error.status)
        ) && failureCount < 2,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
    mutations: {
      onError: (error) => toast.error(getRequestErrorMessage(error)),
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ClientResponseError && error.status === 401) {
        void logout().then(() => {
          queryClient.clear()
          toast.error('登录状态已失效，请重新登录')
          void router.navigate({ to: '/login', replace: true })
        })
      } else if (error instanceof ClientResponseError && error.status === 0) {
        toast.error('无法连接服务器，请检查网络')
      }
    },
  }),
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('缺少应用挂载节点')
if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='light'>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

registerServiceWorker()
