/** 顶栏北京时间：按分钟更新，避免无意义的秒级重渲染。 */
import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { formatBeijingClock } from './beijing-time'

export function BeijingClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let intervalId: number | undefined
    const delay = 60_000 - (Date.now() % 60_000)
    const timeoutId = window.setTimeout(() => {
      setNow(new Date())
      intervalId = window.setInterval(() => setNow(new Date()), 60_000)
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [])

  return (
    <time
      dateTime={now.toISOString()}
      className='hidden items-center gap-1.5 text-xs text-muted-foreground tabular-nums xl:flex'
      aria-label={`北京时间 ${formatBeijingClock(now)}`}
    >
      <Clock3 className='size-3.5' />
      {formatBeijingClock(now)}
    </time>
  )
}
