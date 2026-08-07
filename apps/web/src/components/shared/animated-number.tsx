/** 可访问的数字入场动画；减少动态效果时直接显示最终值。 */
import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

export function AnimatedNumber({
  value,
  format = (current) => Math.round(current).toLocaleString('zh-CN'),
  duration = 0.6,
}: {
  value: number
  format?: (value: number) => string
  duration?: number
}) {
  const reduceMotion = useReducedMotion()
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: setAnimatedValue,
    })
    return () => controls.stop()
  }, [duration, reduceMotion, value])

  const displayValue = reduceMotion ? value : animatedValue

  return (
    <span aria-label={format(value)} className='tabular-nums'>
      {format(displayValue)}
    </span>
  )
}
