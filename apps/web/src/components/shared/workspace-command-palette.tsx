import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Palette,
  Search,
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

const destinations = [
  { label: '总览工作台', to: '/overview', icon: BarChart3 },
  { label: '市场工作台', to: '/market', icon: CalendarDays },
  { label: '商务工作台', to: '/business', icon: BriefcaseBusiness },
  { label: '设计工作台', to: '/design', icon: Palette },
  { label: '剪辑工作台', to: '/editing', icon: Video },
  { label: '全局搜索', to: '/search', icon: Search },
] as const

export function WorkspaceCommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

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
