// 路由：/editing
// 权限：editing, boss
// 用途：剪辑人员维护视频任务、成片归档与发布排期
import { createFileRoute } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { EditingWorkbench } from '@/features/editing'

export const Route = createFileRoute('/_app/editing/')({
  beforeLoad: () => requireRoles(['editing']),
  component: EditingWorkbench,
  errorComponent: RouteError,
})
