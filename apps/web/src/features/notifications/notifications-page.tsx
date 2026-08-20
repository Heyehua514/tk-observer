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
          <EmptyState
            title={filter === 'all' ? '消息都处理完了' : '这个分类暂时没有提醒'}
            description='新的审批、成交和协作提醒会自动出现在这里。'
          />
        ) : (
          <div>
            {visible.map((notification) => {
              const Icon = notificationIcons[notification.type]
              return (
                <button
                  key={notification.id}
                  type='button'
                  className='flex w-full gap-4 border-b px-5 py-4 text-left transition-colors last:border-0 hover:bg-muted/50'
                  onClick={() => void openNotification(notification)}
                >
                  <span className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background'>
                    <Icon className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-center gap-2'>
                      <span className='truncate text-sm font-medium'>
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className='size-1.5 shrink-0 rounded-full bg-primary' />
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
          </div>
        )}
      </section>
    </div>
  )
}
