/** 达人管理 - 详情抽屉；展示只读资料并提供编辑入口。 */
import { ExternalLink, FileVideo, Pencil } from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cooperationStatusLabels } from '../constants'
import { useCreatorVideos } from '../hooks/use-creator-videos'
import type { Creator } from '../types'

export function CreatorDetail({
  creator,
  onClose,
  onEdit,
}: {
  creator: Creator | null
  onClose: () => void
  onEdit: (creator: Creator) => void
}) {
  const videos = useCreatorVideos(creator?.id || '')
  return (
    <Sheet open={!!creator} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        {creator && (
          <>
            <SheetHeader>
              <SheetTitle>{creator.nickname}</SheetTitle>
              <SheetDescription>达人合作资料与最近更新时间</SheetDescription>
            </SheetHeader>
            <div className='space-y-6 px-4 pb-6'>
              <Button
                className='w-full'
                variant='outline'
                onClick={() => onEdit(creator)}
              >
                <Pencil className='size-4' />
                编辑资料
              </Button>
              <dl className='grid grid-cols-[112px_1fr] gap-x-4 gap-y-4 text-sm'>
                <dt className='text-muted-foreground'>合作状态</dt>
                <dd>
                  <Badge variant='secondary'>
                    {cooperationStatusLabels[creator.cooperationStatus]}
                  </Badge>
                </dd>
                <dt className='text-muted-foreground'>所属地区</dt>
                <dd>{creator.region}</dd>
                <dt className='text-muted-foreground'>粉丝量</dt>
                <dd>{creator.followers.toLocaleString()}</dd>
                <dt className='text-muted-foreground'>佣金比例</dt>
                <dd>{creator.commissionRate}%</dd>
                <dt className='text-muted-foreground'>对接人</dt>
                <dd>{creator.owner}</dd>
                <dt className='text-muted-foreground'>TikTok 主页</dt>
                <dd>
                  <a
                    className='inline-flex items-center gap-1 break-all text-primary hover:underline'
                    href={creator.tiktokUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    {creator.tiktokUrl}
                    <ExternalLink className='size-3 shrink-0' />
                  </a>
                </dd>
                <dt className='text-muted-foreground'>创建时间</dt>
                <dd>{formatBeijingTime(creator.created)}</dd>
                <dt className='text-muted-foreground'>更新时间</dt>
                <dd>{formatBeijingTime(creator.updated)}</dd>
              </dl>
              <section className='border-t pt-5'>
                <h3 className='text-sm font-medium'>商务合作标记</h3>
                <div className='mt-3 rounded-lg border p-4 text-sm'>
                  {creator.isBizAvailable ? (
                    <Badge>可商务合作</Badge>
                  ) : (
                    <span className='text-muted-foreground'>未标记商务合作</span>
                  )}
                  {creator.cooperationPrice > 0 && (
                    <dl className='mt-3 grid grid-cols-[112px_1fr] gap-x-4 gap-y-2'>
                      <dt className='text-muted-foreground'>合作报价</dt>
                      <dd>
                        ¥
                        {(creator.cooperationPrice / 100).toLocaleString(
                          'zh-CN',
                          { maximumFractionDigits: 0 }
                        )}
                      </dd>
                      {creator.cooperationNotes && (
                        <>
                          <dt className='text-muted-foreground'>合作备注</dt>
                          <dd className='whitespace-pre-wrap break-words'>
                            {creator.cooperationNotes}
                          </dd>
                        </>
                      )}
                    </dl>
                  )}
                </div>
              </section>
              <section className='border-t pt-5'>
                <h3 className='flex items-center gap-2 text-sm font-medium'>
                  <FileVideo className='size-4' />
                  关联视频
                </h3>
                {videos.isLoading ? (
                  <p className='mt-3 text-sm text-muted-foreground'>
                    正在加载关联视频…
                  </p>
                ) : videos.data?.length ? (
                  <div className='mt-3 space-y-2'>
                    {videos.data.map((video) => (
                      <div key={video.id} className='rounded-lg border p-3'>
                        <div className='text-sm font-medium'>{video.title}</div>
                        <div className='mt-1 text-xs text-muted-foreground'>
                          {video.productName || '未关联商品'} · {video.region}
                        </div>
                        <div className='mt-1 text-xs text-muted-foreground'>
                          {video.publishAt
                            ? `发布：${formatBeijingTime(video.publishAt)}`
                            : '尚未排期'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='mt-3 text-sm text-muted-foreground'>
                    暂无关联视频
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
