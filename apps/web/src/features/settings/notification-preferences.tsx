/** 通知偏好页；权限：所有已登录角色；用途：控制本人通知类别。 */
import { BellRing, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import { useNotificationPreferences } from './hooks/use-notification-preferences'
import {
  notificationPreferenceItems,
  type NotificationPreferences,
} from './notification-preferences-model'

export function NotificationPreferencesPage() {
  const preferences = useNotificationPreferences()
  const data = preferences.data
  const update = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!data) return
    const next = {
      ...data,
      [key]: value,
    }
    try {
      await preferences.save(next)
      toast.success('通知偏好已保存')
    } catch {
      toast.error('通知偏好保存失败，请稍后重试')
    }
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='通知偏好'
        description='只影响你本人收到的提醒，不改变团队通知规则。'
      />
      <Card className='glass-card max-w-2xl rounded-2xl border bg-background/60 shadow-none backdrop-blur-xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <BellRing className='size-4 text-primary' />
            提醒类别
          </CardTitle>
          <CardDescription>
            关闭后，系统不会为你生成对应类别的新提醒。
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-1'>
          {preferences.isLoading || !data ? (
            <LoaderCircle className='size-4 animate-spin text-muted-foreground' />
          ) : (
            notificationPreferenceItems.map((item) => (
              <div
                key={item.key}
                className='flex items-center justify-between gap-4 border-b py-4 last:border-0'
              >
                <div>
                  <div className='text-sm font-medium'>{item.title}</div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    {item.description}
                  </div>
                </div>
                <Switch
                  checked={data[item.key]}
                  onCheckedChange={(value) => void update(item.key, value)}
                  disabled={preferences.isSaving}
                  aria-label={item.title}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
