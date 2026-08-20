import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type CascaderOption = {
  label: string
  value: string
  children?: CascaderOption[]
  disabled?: boolean
}

type CascaderProps = {
  options: CascaderOption[]
  value?: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  className?: string
  'aria-label': string
}

function findPath(
  options: CascaderOption[],
  values: string[]
): CascaderOption[] {
  const path: CascaderOption[] = []
  let current = options

  for (const value of values) {
    const item = current.find((option) => option.value === value)
    if (!item) return []
    path.push(item)
    current = item.children || []
  }

  return path
}

export function Cascader({
  options,
  value = [],
  onValueChange,
  placeholder = '请选择',
  className,
  'aria-label': ariaLabel,
}: CascaderProps) {
  const [open, setOpen] = useState(false)
  const [drillPath, setDrillPath] = useState<CascaderOption[]>([])
  const selectedPath = useMemo(() => findPath(options, value), [options, value])
  const currentOptions =
    drillPath.length > 0
      ? drillPath[drillPath.length - 1]?.children || []
      : options
  const display = selectedPath.map((option) => option.label).join(' / ')

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setDrillPath([])
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-label={display || ariaLabel}
          variant='outline'
          className={cn(
            'glass-control w-full justify-between gap-3 text-left font-normal',
            !display && 'text-muted-foreground',
            className
          )}
        >
          <span className='truncate'>{display || placeholder}</span>
          <ChevronDown className='size-4 shrink-0 opacity-60' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='glass-popover w-(--radix-popover-trigger-width) min-w-64 p-1.5'
      >
        {drillPath.length > 0 && (
          <Button
            variant='ghost'
            className='mb-1 w-full justify-start gap-2'
            onClick={() => setDrillPath((path) => path.slice(0, -1))}
          >
            <ChevronLeft className='size-4' />
            返回
          </Button>
        )}
        <div className='max-h-72 overflow-y-auto p-0.5' role='listbox'>
          {currentOptions.map((option) => {
            const hasChildren = Boolean(option.children?.length)
            const isSelected = value[value.length - 1] === option.value
            return (
              <button
                key={option.value}
                type='button'
                role='option'
                aria-selected={isSelected}
                disabled={option.disabled}
                className='cascader-option'
                onClick={() => {
                  if (hasChildren) {
                    setDrillPath((path) => [...path, option])
                    return
                  }
                  const nextValue = [
                    ...drillPath.map((item) => item.value),
                    option.value,
                  ]
                  onValueChange(nextValue)
                  setOpen(false)
                  setDrillPath([])
                }}
              >
                <span className='truncate'>{option.label}</span>
                {hasChildren ? (
                  <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
                ) : isSelected ? (
                  <Check className='size-4 shrink-0 text-primary' />
                ) : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
