/** 达人管理 - 详情抽屉；展示只读资料并提供编辑入口。 */
import { ExternalLink, Pencil } from 'lucide-react'
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
                    className='inline-flex items-center gap-1 break-all text-blue-600 hover:underline'
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
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
