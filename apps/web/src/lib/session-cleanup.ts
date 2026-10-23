import type { QueryClient } from '@tanstack/react-query'

type ClearableQueryClient = Pick<QueryClient, 'clear'>
type ClearableStorage = Pick<Storage, 'clear'>

/** 退出、401 或切换服务器时统一清空查询缓存与会话级浏览器状态。 */
export function clearClientSession(
  queryClient: ClearableQueryClient,
  storage: ClearableStorage = sessionStorage
): void {
  queryClient.clear()
  storage.clear()
}
