/** 通知中心列表页；路由：/notifications；权限：所有已登录角色。 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AppNotification, NotificationType } from '@/types/notification'
import {
  CheckCheck,
  CircleDollarSign,
  ClockAlert,
  MessageSquare,
  Palette,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBeijingTime } from '@/lib/format'
import { useMarkNotificationRead } from '@/hooks/use-mark-notification-read'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadStateError } from '@/components/shared/load-state-error'
import { PageHeader } from '@/components/shared/page-header'
import {
  filterNotifications,
  notificationFilterLabels,
  groupNotificationsByDay,
  type NotificationFilter,
} from './notification-list-model'
import { resolveNotificationTarget } from './notification-target'

const notificationIcons = {
  design_review: Palette,
  gmv_target: CircleDollarSign,
  comment: MessageSquare,
  deadline: ClockAlert,
  opportunity_won: CircleDollarSign,
} satisfies Record<NotificationType, LucideIcon>

const filters: NotificationFilter[] = [
  'all',
  'unread',
  'deadline',
  'design_review',
  'comment',
  'opportunity_won',
]

export function NotificationsPage() {
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const items = notifications.data || []
  const visible = filterNotifications(items, filter)
  const groups = groupNotificationsByDay(visible)

  const openNotification = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) await markRead.mutateAsync([notification.id])
      const target = resolveNotificationTarget(notification)
      await navigate({
        to: target.to,
        search: target.taskId
          ? { taskId: target.taskId }
          : target.recordType && target.recordId
            ? { recordType: target.recordType, recordId: target.recordId }
            : {},
        replace: true,
      })
    } catch {
      toast.error('通知打开失败，请稍后重试')
    }
  }

  const markAllRead = () => {
    const unread = items.filter((item) => !item.isRead).map((item) => item.id)
    if (unread.length) markRead.mutate(unread)
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='通知中心'
        description='集中查看审批、到期、成交和协作跟进提醒。'
        action={
          <Button
            variant='outline'
            size='sm'
            onClick={markAllRead}
            disabled={!items.some((item) => !item.isRead) || markRead.isPending}
          >
            <CheckCheck className='size-4' />
            全部已读
          </Button>
        }
      />
      <div className='flex flex-wrap gap-2'>
        {filters.map((value) => {
          const count = filterNotifications(items, value).length
          return (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'outline'}
              size='sm'
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {notificationFilterLabels[value]}{' '}
              <span className='text-xs opacity-70'>{count}</span>
            </Button>
          )
        })}
      </div>
      <section className='glass-card overflow-hidden rounded-2xl border bg-background/60 backdrop-blur-xl'>
        {notifications.isLoading ? (
          <LoadStateError
            title='正在加载通知…'
            description='获取你的最近通知。'
          />
        ) : notifications.isError ? (
          <LoadStateError
            title='通知加载失败'
            description='请检查数据服务后重试。'
            onRetry={() => void notifications.refetch()}
          />
        ) : visible.length === 0 ? (
          <div className='space-y-4 p-5'>
            <EmptyState
              title={
                filter === 'all' ? '消息都处理完了' : '这个分类暂时没有提醒'
              }
              description='新的审批、成交和协作提醒会自动出现在这里。'
            />
            {filter !== 'all' && (
              <div className='flex justify-center'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void navigate({ to: '/notifications' })}
                >
                  查看全部通知
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <section
                key={group.label}
                aria-labelledby={`notification-${group.label}`}
              >
                <h2
                  id={`notification-${group.label}`}
                  className='border-b bg-muted/20 px-5 py-2 text-xs font-semibold tracking-wide text-muted-foreground'
                >
                  {group.label}
                </h2>
                {group.items.map((notification) => {
                  const Icon = notificationIcons[notification.type]
                  return (
                    <button
                      key={notification.id}
                      type='button'
                      className={`flex w-full gap-4 border-b px-5 py-4 text-left transition-colors last:border-0 hover:bg-muted/50 ${notification.isRead ? '' : 'bg-primary/[0.04]'}`}
                      onClick={() => void openNotification(notification)}
                    >
                      <span className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background'>
                        <Icon className='size-4' />
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='flex items-center gap-2'>
                          <span
                            className={`truncate text-sm ${notification.isRead ? 'font-medium' : 'font-semibold'}`}
                          >
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span
                              className='size-1.5 shrink-0 rounded-full bg-primary'
                              aria-label='未读'
                            />
                          )}
                        </span>
                        <span className='mt-1 block text-sm text-muted-foreground'>
                          {notification.content}
                        </span>
                        <span className='mt-2 block text-xs text-muted-foreground'>
                          {formatBeijingTime(notification.created)}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
