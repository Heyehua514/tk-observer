import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { isDatePickerDateDisabled } from './date-picker-model'

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  ariaLabel?: string
  allowFuture?: boolean
  className?: string
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = '选择日期',
  ariaLabel,
  allowFuture = false,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!selected}
          aria-label={ariaLabel ?? placeholder}
          className={`w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground sm:w-60 ${className ?? ''}`}
        >
          {selected ? (
            format(selected, 'yyyy年M月d日')
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={onSelect}
          disabled={(date: Date) => isDatePickerDateDisabled(date, allowFuture)}
        />
      </PopoverContent>
    </Popover>
  )
}
