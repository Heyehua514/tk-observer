/** 主应用壳：折叠侧边栏、顶部搜索、主题与用户菜单。 */
import { useEffect } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ACCESS_DENIED_SESSION_KEY } from '@/lib/auth'
import { getCookie } from '@/lib/cookies'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { BeijingClock } from '@/components/shared/beijing-clock'
import { GlobalRecordDetail } from '@/components/shared/global-record-detail'
import { LoginGreeting } from '@/components/shared/login-greeting'
import { NotificationBell } from '@/components/shared/notification-bell'
import { PageTransition } from '@/components/shared/page-transition'
import { UserMenu } from '@/components/shared/user-menu'
import { WorkspaceAtmosphere } from '@/components/shared/workspace-atmosphere'
import { ThemeSwitch } from '@/components/theme-switch'

const breadcrumbs: Record<string, string> = {
  overview: '总览工作台',
  business: '商务工作台',
  market: '市场工作台',
  design: '设计工作台',
  editing: '剪辑工作台',
  settings: '系统设置',
}

export function AppShell() {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const pathname = useLocation({ select: (location) => location.pathname })
  const section = pathname.split('/')[1] || 'overview'
  useEffect(() => {
    if (sessionStorage.getItem(ACCESS_DENIED_SESSION_KEY)) {
      sessionStorage.removeItem(ACCESS_DENIED_SESSION_KEY)
      toast.error('您无权访问该页面')
    }
  }, [])
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset className='observatory-inset'>
            <WorkspaceAtmosphere />
            <Header fixed className='observatory-header'>
              <div className='text-[11px] font-medium tracking-[0.16em] text-foreground/50 uppercase'>
                {breadcrumbs[section] || 'TK观察工作台'}
              </div>
              <div className='ml-auto flex items-center gap-2'>
                <Search placeholder='全局搜索' className='hidden md:flex' />
                <BeijingClock />
                <NotificationBell />
                <ThemeSwitch />
                <UserMenu />
              </div>
            </Header>
            <LoginGreeting />
            <main
              id='main-content'
              className='content-shell relative z-10 min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 xl:px-8'
            >
              <PageTransition transitionKey={pathname}>
                <Outlet />
              </PageTransition>
            </main>
            <GlobalRecordDetail />
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
