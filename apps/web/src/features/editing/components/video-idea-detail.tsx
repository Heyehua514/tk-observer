/** 爆款选题详情抽屉：展示完整指标和原视频链接。 */
import { ExternalLink, Flame } from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { VideoIdea } from '../types'

export function VideoIdeaDetail({
  idea,
  open,
  onOpenChange,
}: {
  idea: VideoIdea | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!idea) return null
  const fields = [
    ['账号', idea.account],
    ['视频类型', idea.videoType],
    ['发布日期', idea.publishDate],
    ['播放量', idea.views.toLocaleString()],
    ['点赞数', idea.likes.toLocaleString()],
    ['评论数', idea.comments.toLocaleString()],
    ['转发数', idea.shares.toLocaleString()],
    ['完播率', `${idea.completionRate}%`],
    ['涨粉数', idea.followerGain.toLocaleString()],
    ['标签', idea.tags || '未填写'],
    ['更新时间', formatBeijingTime(idea.updated)],
  ]
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            {idea.isViral && <Flame className='size-4 text-orange-500' />}
            {idea.title}
          </SheetTitle>
          <SheetDescription>选题完整数据与服务端自动判定结果</SheetDescription>
        </SheetHeader>
        <div className='space-y-6 px-4 pb-6'>
          <div className='flex items-center gap-2'>
            <Badge variant={idea.isViral ? 'default' : 'secondary'}>
              {idea.isViral ? '爆款' : '普通'}
            </Badge>
            {idea.sourceUrl && (
              <a
                href={idea.sourceUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-sm text-blue-600 hover:underline'
              >
                打开原视频 <ExternalLink className='size-3' />
              </a>
            )}
          </div>
          <dl className='grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className='text-muted-foreground'>{label}</dt>
                <dd className='mt-1 font-medium'>{value}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h3 className='text-sm font-medium'>内容简述</h3>
            <p className='mt-2 text-sm whitespace-pre-wrap text-muted-foreground'>
              {idea.description || '暂无内容简述'}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
