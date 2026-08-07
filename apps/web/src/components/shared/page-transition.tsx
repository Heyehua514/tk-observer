/** 路由内容的统一淡入上移动画。 */
import { motion, useReducedMotion } from 'framer-motion'

export function PageTransition({
  children,
  transitionKey,
}: {
  children: React.ReactNode
  transitionKey: string
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      key={transitionKey}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
