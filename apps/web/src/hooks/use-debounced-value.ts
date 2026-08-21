/** 将高频输入延迟指定毫秒后输出，默认用于 250ms 输入即搜。 */
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])
  return debouncedValue
}
