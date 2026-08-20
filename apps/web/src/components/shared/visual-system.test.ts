import themeSource from '@/styles/theme.css?raw'
import { expect, it } from 'vitest'
import cardSource from '@/components/ui/card.tsx?raw'
import tabsSource from '@/components/ui/tabs.tsx?raw'
import appShellSource from '@/components/layout/app-shell.tsx?raw'
import atmosphereSource from '@/components/shared/workspace-atmosphere.tsx?raw'
import businessDashboardSource from '@/features/business/dashboard/business-dashboard.tsx?raw'
import overviewDashboardSource from '@/features/overview/components/overview-dashboard.tsx?raw'

it('keeps dark tabs legible and the fixed header above workspace content', () => {
  expect(tabsSource).toContain('dark:data-[state=active]:text-foreground')
  expect(appShellSource).toContain(
    'text-[11px] font-medium tracking-[0.16em] text-foreground/50 uppercase'
  )
  expect(appShellSource).toContain(
    'content-shell relative z-10 min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 xl:px-8'
  )
})

it('renders KPI signal bars instead of incomplete pseudo-elements', () => {
  expect(overviewDashboardSource).toContain("before:content-['']")
  expect(businessDashboardSource).toContain("before:content-['']")
})

it('provides stable color and elevation fallbacks for desktop webviews', () => {
  expect(themeSource).toContain('@supports not (color: oklch(0 0 0))')
  expect(cardSource).toContain('shadow-sm')
})

it('uses a restrained glass shell with an accessible overview anchor directory', () => {
  expect(themeSource).toContain('--glass-bg')
  expect(appShellSource).toContain('observatory-inset')
  expect(overviewDashboardSource).toContain("label='总览目录'")
  expect(atmosphereSource).toContain('observatory-halo')
})
