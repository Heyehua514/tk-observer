/**
 * 列表页通用受控搜索输入框。
 * @param value 当前关键词
 * @param onChange 关键词变化回调
 * @param placeholder 字段范围提示
 */
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SearchBar({
  value,
  onChange,
  placeholder = '搜索',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className='relative w-full max-w-sm'>
      <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className='pr-9 pl-9'
      />
      {value && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute top-1/2 right-1 size-7 -translate-y-1/2'
          onClick={() => onChange('')}
          aria-label='清空搜索'
        >
          <X className='size-4' />
        </Button>
      )}
    </div>
  )
}
