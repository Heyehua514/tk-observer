import { useState } from 'react'
import { cn } from '@/lib/utils'

export type AnchorNavigationItem = {
  id: string
  label: string
}

type AnchorNavigationProps = {
  items: AnchorNavigationItem[]
  label: string
  className?: string
}

export function AnchorNavigation({
  items,
  label,
  className,
}: AnchorNavigationProps) {
  const [activeId, setActiveId] = useState(items[0]?.id)

  if (!items.length) return null

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <nav
      aria-label={label}
      className={cn('anchor-navigation', className)}
      data-slot='anchor-navigation'
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={activeId === item.id ? 'location' : undefined}
          className='anchor-navigation-link'
          onClick={(event) => {
            event.preventDefault()
            setActiveId(item.id)
            document.getElementById(item.id)?.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
              block: 'start',
            })
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}
