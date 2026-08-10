/** 指标卡动效编排；尊重系统减弱动效设置，不接触业务数据。 */
import { Children } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MetricDeck({
  children,
  className,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode
  className?: string
  'aria-label': string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-label={ariaLabel}
      className={cn('grid gap-4', className)}
      data-kpi-deck='true'
    >
      {Children.map(children, (child, index) => (
        <motion.div
          data-motion={reduceMotion ? 'reduced' : 'entrance'}
          data-testid={`metric-motion-${index}`}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.24,
            delay: reduceMotion ? 0 : index * 0.04,
            ease: 'easeOut',
          }}
        >
          {child}
        </motion.div>
      ))}
    </section>
  )
}
