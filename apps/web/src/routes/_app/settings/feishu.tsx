/** 路由：飞书连接；权限：所有已登录角色。 */
import { createFileRoute } from '@tanstack/react-router'
import { RouteError } from '@/components/shared/route-error'
import { FeishuConnectPage } from '@/features/settings/feishu-connect'

export const Route = createFileRoute('/_app/settings/feishu')({
  component: FeishuConnectPage,
  errorComponent: RouteError,
})
