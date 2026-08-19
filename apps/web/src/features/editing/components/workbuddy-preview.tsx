/** 简单只读 JSON 预览块。 */
import { useState } from 'react'

export function BoundOutput({ value }: { value: string | null }) {
  const [open, setOpen] = useState(false)
  if (!value) return null
  return (
    <div className='space-y-2'>
      <button
        type='button'
        className='text-xs text-primary'
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '收起结果' : '查看分析结果'}
      </button>
      {open && (
        <pre className='max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap'>
          {value}
        </pre>
      )}
    </div>
  )
}
