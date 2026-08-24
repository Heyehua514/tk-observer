import { RefreshCw, UsersRound } from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVideoAccountSync } from '../hooks/use-video-account-sync'

const statusLabel: Record<string, string> = {
  completed: '已完成',
  running: '同步中',
  partial: '部分完成',
  failed: '失败',
}

export function VideoAccountSyncPanel() {
  const sync = useVideoAccountSync()
  const latestRun = sync.data?.runs[0]
  const latestStats = new Map<
    string,
    NonNullable<typeof sync.data>['stats'][number]
  >()
  for (const item of sync.data?.stats ?? [])
    if (item.video_account_id && !latestStats.has(item.video_account_id))
      latestStats.set(item.video_account_id, item)
  return (
    <Card className='shadow-none'>
      <CardHeader className='flex-row items-center justify-between gap-3'>
        <div>
          <CardTitle className='text-base'>视频号同步状态</CardTitle>
          <p className='mt-1 text-xs text-muted-foreground'>
            数据由 Android 采集端每日写入，工作台只展示同步结果。
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => void sync.refetch()}
          disabled={sync.isFetching}
        >
          <RefreshCw
            className={sync.isFetching ? 'size-4 animate-spin' : 'size-4'}
          />
          刷新
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3 sm:grid-cols-3'>
          {(sync.data?.accounts ?? []).map((account) => {
            const stat = latestStats.get(account.id)
            return (
              <div key={account.id} className='rounded-lg border p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex min-w-0 items-center gap-2 font-medium'>
                    <UsersRound className='size-4 shrink-0 text-primary' />
                    <span className='truncate'>{account.name}</span>
                  </div>
                  <Badge
                    variant={
                      account.status === 'active' ? 'secondary' : 'destructive'
                    }
                  >
                    {account.status === 'active' ? '正常' : account.status}
                  </Badge>
                </div>
                <div className='mt-3 grid grid-cols-2 gap-2 text-sm'>
                  <div>
                    <div className='text-xs text-muted-foreground'>
                      粉丝总数
                    </div>
                    <div className='font-semibold'>
                      {stat?.follower_count?.toLocaleString() ?? '暂无'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-muted-foreground'>日涨粉</div>
                    <div className='font-semibold'>
                      {stat?.follower_gain === null ||
                      stat?.follower_gain === undefined
                        ? '暂无'
                        : `${stat.follower_gain >= 0 ? '+' : ''}${stat.follower_gain.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className='flex items-center justify-between border-t pt-3 text-sm'>
          <span className='text-muted-foreground'>最近批次</span>
          {latestRun ? (
            <Badge
              variant={
                latestRun.status === 'failed' ? 'destructive' : 'secondary'
              }
            >
              {statusLabel[latestRun.status] ?? latestRun.status} ·{' '}
              {latestRun.total_rows} 条
            </Badge>
          ) : (
            <span className='text-muted-foreground'>尚未同步</span>
          )}
        </div>
        {latestRun?.finished_at && (
          <div className='text-xs text-muted-foreground'>
            完成于 {formatBeijingTime(latestRun.finished_at)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
