// 路由：/design
// 权限：design, boss
// 用途：设计人员维护素材、设计任务与品牌规范
import { createFileRoute } from '@tanstack/react-router'
import { requireRoles } from '@/lib/auth'
import { RouteError } from '@/components/shared/route-error'
import { DesignWorkbench } from '@/features/design'

export const Route = createFileRoute('/_app/design/')({
  beforeLoad: () => requireRoles(['design']),
  component: DesignWorkbench,
  errorComponent: RouteError,
})
