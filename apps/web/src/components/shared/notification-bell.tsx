/**
 * 顶部栏站内通知入口。
 * @description 展示未读红点、最近通知，支持单条跳转和全部已读。
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AppNotification, NotificationType } from '@/types/notification'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  ClockAlert,
  MessageSquare,
  Palette,
} from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import { useMarkNotificationRead } from '@/hooks/use-mark-notification-read'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { EmptyState } from '@/components/shared/empty-state'

const notificationIcons = {
  design_review: Palette,
  gmv_target: CircleDollarSign,
  comment: MessageSquare,
  deadline: ClockAlert,
} satisfies Record<NotificationType, typeof Bell>

const allowedLinks = [
  '/overview',
  '/business',
  '/market',
  '/design',
  '/editing',
  '/settings',
] as const

function getSafeLink(link: string) {
  return allowedLinks.find((path) => link === path) || '/overview'
}

export function NotificationBell() {
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()
  const items = notifications.data || []
  const unreadItems = items.filter((item) => !item.isRead)
  const previousUnread = useRef<number | null>(null)
  const bellControls = useAnimationControls()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (
      !reduceMotion &&
      previousUnread.current !== null &&
      unreadItems.length > previousUnread.current
    ) {
      void bellControls.start({
        rotate: [0, 15, -15, 15, -15, 15, 0],
        transition: { duration: 0.55 },
      })
    }
    previousUnread.current = unreadItems.length
  }, [bellControls, reduceMotion, unreadItems.length])

  const openNotification = async (notification: AppNotification) => {
    if (!notification.isRead) await markRead.mutateAsync([notification.id])
    await navigate({ to: getSafeLink(notification.link) })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative'
          aria-label='通知'
        >
          <motion.span animate={bellControls} className='inline-flex'>
            <Bell className='size-4' />
          </motion.span>
          {unreadItems.length > 0 && (
            <span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-background' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[min(380px,calc(100vw-32px))] p-0'
      >
        <div className='flex h-12 items-center justify-between border-b px-4'>
          <div>
            <div className='text-sm font-medium'>通知</div>
            <div className='text-xs text-muted-foreground'>
              {unreadItems.length
                ? `${unreadItems.length} 条未读`
                : '已全部读取'}
            </div>
          </div>
          {unreadItems.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              disabled={markRead.isPending}
              onClick={() =>
                markRead.mutate(unreadItems.map((item) => item.id))
              }
            >
              <CheckCheck className='size-4' />
              全部已读
            </Button>
          )}
        </div>
        <div className='max-h-96 overflow-y-auto'>
          {notifications.isLoading ? (
            <div className='p-8 text-center text-sm text-muted-foreground'>
              正在加载通知…
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title='消息都处理完了'
              description='新的审批、成交和协作提醒会出现在这里。'
            />
          ) : (
            items.map((notification) => {
              const Icon = notificationIcons[notification.type]
              return (
                <button
                  key={notification.id}
                  type='button'
                  className='flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted/50'
                  onClick={() => void openNotification(notification)}
                >
                  <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background'>
                    <Icon className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-center gap-2'>
                      <span className='truncate text-sm font-medium'>
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className='size-1.5 shrink-0 rounded-full bg-blue-600' />
                      )}
                    </span>
                    <span className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
                      {notification.content}
                    </span>
                    <span className='mt-1 block text-xs text-muted-foreground'>
                      {formatBeijingTime(notification.created)}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
