/**
 * 主应用动态侧边栏。
 * boss 展示全部工作台；商务额外进入设计工作台提交需求。
 */
import { Link, useLocation } from '@tanstack/react-router'
import type { UserRole } from '@/types/auth'
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Clapperboard,
  Palette,
  Settings,
  Store,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useLayout } from '@/context/layout-provider'
import { useRecentPages } from '@/hooks/use-recent-pages'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const titleByPath: Record<string, { title: string; icon: typeof Store }> = {
  '/overview': { title: '总览工作台', icon: ChartNoAxesCombined },
  '/market': { title: '市场工作台', icon: Store },
  '/business': { title: '商务工作台', icon: BriefcaseBusiness },
  '/design': { title: '设计工作台', icon: Palette },
  '/editing': { title: '剪辑工作台', icon: Clapperboard },
}

const navigation = [
  {
    title: '总览工作台',
    to: '/overview' as const,
    role: 'boss' as const,
    icon: ChartNoAxesCombined,
  },
  {
    title: '团队日历',
    to: '/overview/calendar' as const,
    role: 'boss' as const,
    icon: CalendarDays,
  },
  {
    title: '商务工作台',
    to: '/business' as const,
    role: 'business' as const,
    icon: BriefcaseBusiness,
  },
  {
    title: '市场工作台',
    to: '/market' as const,
    role: 'market' as const,
    icon: Store,
  },
  {
    title: '设计工作台',
    to: '/design' as const,
    role: 'design' as const,
    icon: Palette,
  },
  {
    title: '剪辑工作台',
    to: '/editing' as const,
    role: 'editing' as const,
    icon: Clapperboard,
  },
]

function canSee(role: UserRole, itemRole: UserRole) {
  return role === 'boss' || role === itemRole
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const role = useAuthStore((state) => state.user?.role)
  const pathname = useLocation({ select: (location) => location.pathname })
  const recent = useRecentPages()
  if (!role) return null

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader className='h-16 justify-center border-b border-sidebar-border/70 bg-sidebar px-4'>
        <Link to='/overview' className='flex min-w-0 items-center gap-3'>
          <span className='logo-glow flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold tracking-[-0.04em] text-sidebar-primary-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--sidebar-primary)_12%,transparent)]'>
            TK
          </span>
          <span className='truncate font-semibold group-data-[collapsible=icon]:hidden'>
            TK观察工作台
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>工作台</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation
                .filter(
                  (item) =>
                    canSee(role, item.role) ||
                    (role === 'business' && item.to === '/design')
                )
                .map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname.startsWith(item.to)}
                    >
                      <Link to={item.to}>
                        <item.icon className='size-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {recent.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>最近访问</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recent.map((path) => {
                  const meta = titleByPath[path]
                  if (!meta) return null
                  return (
                    <SidebarMenuItem key={path}>
                      <SidebarMenuButton
                        asChild
                        tooltip={meta.title}
                        isActive={pathname.startsWith(path)}
                      >
                        <Link to={path}>
                          <meta.icon className='size-4' />
                          <span>{meta.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup className='mt-auto'>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip='系统设置'
                  isActive={pathname.startsWith('/settings')}
                >
                  <Link to='/settings'>
                    <Settings className='size-4' />
                    <span>系统设置</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className='px-3 pb-1 text-[10px] text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden'>
          TK观察 · v0.9.6
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
