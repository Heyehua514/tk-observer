// 路由：/settings
// 权限：所有已登录角色
// 用途：配置本机连接的 PocketBase 服务器地址
import { createFileRoute } from '@tanstack/react-router'
import { RouteError } from '@/components/shared/route-error'
import { ServerSettings } from '@/features/settings/server-settings'

export const Route = createFileRoute('/_app/settings/')({
  component: ServerSettings,
  errorComponent: RouteError,
})
