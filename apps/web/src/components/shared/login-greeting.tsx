/** 登录问候浮层：按北京时间显示，每位用户每个会话仅播放一次。 */
import { useEffect, useState } from 'react'
import type { AppUser } from '@/types/auth'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { getBeijingHour, getGreetingForBeijingHour } from './greeting-utils'

const GREETING_SESSION_PREFIX = 'tk-observer-greeting:'

export function LoginGreeting() {
  const user = useAuthStore((state) => state.user)
  return user ? <UserGreeting key={user.id} user={user} /> : null
}

function UserGreeting({ user }: { user: AppUser }) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = `${GREETING_SESSION_PREFIX}${user.id}`
    if (sessionStorage.getItem(key)) return
    const timeoutId = window.setTimeout(() => {
      sessionStorage.setItem(key, 'shown')
      setVisible(true)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [user.id])

  const greeting = getGreetingForBeijingHour(getBeijingHour(new Date()))

  useEffect(() => {
    if (!visible) return
    const timeoutId = window.setTimeout(() => setVisible(false), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role='status'
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.96 }
          }
          animate={
            reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }
          }
          transition={
            reduceMotion
              ? { duration: 0.12 }
              : { type: 'spring', stiffness: 340, damping: 24 }
          }
          className='pointer-events-none fixed top-16 left-1/2 z-50 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950/90 px-5 py-4 text-white shadow-2xl backdrop-blur-md'
        >
          <p className='text-base font-semibold'>{greeting}</p>
          <p className='mt-1 text-sm text-slate-300'>今天也要稳稳推进</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
