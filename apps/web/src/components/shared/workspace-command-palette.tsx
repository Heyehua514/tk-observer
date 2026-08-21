import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChartSpline,
  Palette,
  Search,
  Target,
  Video,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { useRecentPages } from '@/hooks/use-recent-pages'
import { defaultEditingSearch } from '@/features/editing/constants'

const destinations = [
  { label: '总览工作台', to: '/overview', icon: BarChart3 },
  { label: '市场工作台', to: '/market', icon: CalendarDays },
  { label: '商务工作台', to: '/business', icon: BriefcaseBusiness },
  { label: '设计工作台', to: '/design', icon: Palette },
  { label: '剪辑工作台', to: '/editing', icon: Video },
  { label: '全局搜索', to: '/search', icon: Search },
] as const

const shortcutActions = [
  {
    key: 'business-opportunities',
    label: '查看商务商机',
    icon: Target,
  },
  {
    key: 'editing-analytics',
    label: '查看剪辑数据分析',
    icon: ChartSpline,
  },
] as const

const destinationByPath = Object.fromEntries(
  destinations.map((destination) => [destination.to, destination])
) as Record<(typeof destinations)[number]['to'], (typeof destinations)[number]>

export function WorkspaceCommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const recentPages = useRecentPages()

  const runShortcut = (key: (typeof shortcutActions)[number]['key']) => {
    if (key === 'business-opportunities') {
      void navigate({
        to: '/business',
        search: {
          page: 1,
          perPage: 20,
          query: '',
          region: 'all',
          status: 'all',
          bizOnly: false,
          sort: '-updated',
          tab: 'opportunities',
          companyPage: 1,
          companyQuery: '',
          companyRegion: 'all',
          companyKind: 'all',
          companySort: '-updated',
        },
      })
      return
    }
    void navigate({
      to: '/editing',
      search: { ...defaultEditingSearch, tab: 'analytics' },
    })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title='工作台快捷导航'
      description='搜索并跳转到工作台或全局搜索。'
      className='max-w-lg'
    >
      <CommandInput placeholder='搜索工作台或功能...' />
      <CommandList>
        <CommandEmpty>没有匹配的快捷入口</CommandEmpty>
        {recentPages.length > 0 && (
          <CommandGroup heading='最近访问'>
            {recentPages.map((to) => {
              const destination = destinationByPath[to]
              if (!destination) return null
              const Icon = destination.icon
              return (
                <CommandItem
                  key={`recent-${to}`}
                  value={`最近访问 ${destination.label}`}
                  onSelect={() => {
                    setOpen(false)
                    void navigate({ to })
                  }}
                >
                  <Icon />
                  <span>{destination.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
        <CommandGroup heading='快捷操作'>
          {shortcutActions.map(({ key, label, icon: Icon }) => (
            <CommandItem
              key={label}
              value={label}
              onSelect={() => {
                setOpen(false)
                runShortcut(key)
              }}
            >
              <Icon />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading='快捷导航'>
          {destinations.map(({ label, to, icon: Icon }) => (
            <CommandItem
              key={to}
              value={label}
              onSelect={() => {
                setOpen(false)
                void navigate({ to })
              }}
            >
              <Icon />
              <span>{label}</span>
              {to === '/overview' && <CommandShortcut>Ctrl K</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
