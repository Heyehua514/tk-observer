/** 成片表现数据打卡与复盘对话框。 */
import { useState } from 'react'
import { Eye, Heart, MessageSquare, Percent, Share2, ShoppingBag, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { VideoArchiveItem } from './production-model'
import { useCreateVideoMetricsLog } from '../hooks/use-create-video-metrics-log'
import { type VideoMetricsLogInput } from '../video-metrics-model'

export function VideoMetricsDialog({
  open,
  onOpenChange,
  video,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  video: VideoArchiveItem | null
}) {
  const createLog = useCreateVideoMetricsLog()

  const [views, setViews] = useState(String(video?.views || ''))
  const [likes, setLikes] = useState(String(video?.likes || ''))
  const [comments, setComments] = useState(String(video?.comments || ''))
  const [shares, setShares] = useState(String(video?.shares || ''))
  const [completionRate, setCompletionRate] = useState(String(video?.completionRate || ''))
  const [orderCount, setOrderCount] = useState(String(video?.orderCount || ''))
  const [gmvYuan, setGmvYuan] = useState(
    video?.conversionGmvCents ? (video.conversionGmvCents / 100).toFixed(2) : ''
  )
  const [notes, setNotes] = useState('')

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && video) {
      setViews(String(video.views || ''))
      setLikes(String(video.likes || ''))
      setComments(String(video.comments || ''))
      setShares(String(video.shares || ''))
      setCompletionRate(String(video.completionRate || ''))
      setOrderCount(String(video.orderCount || ''))
      setGmvYuan(
        video.conversionGmvCents ? (video.conversionGmvCents / 100).toFixed(2) : ''
      )
      setNotes('')
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!video) return

    const cents = Math.round(parseFloat(gmvYuan || '0') * 100)
    const payload: VideoMetricsLogInput = {
      videoId: video.id,
      views: parseInt(views || '0', 10),
      likes: parseInt(likes || '0', 10),
      comments: parseInt(comments || '0', 10),
      shares: parseInt(shares || '0', 10),
      completionRate: parseFloat(completionRate || '0'),
      conversionGmvCents: isNaN(cents) ? 0 : cents,
      orderCount: parseInt(orderCount || '0', 10),
      notes: notes.trim() || undefined,
    }

    await createLog.mutateAsync(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <TrendingUp className='size-5 text-primary' />
            回流数据表现
          </DialogTitle>
          <DialogDescription>
            登记【{video?.title || '视频'}】在平台的真实播放、完播与带货出单数据。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Eye className='size-3.5' /> 播放量 (Views)
              </Label>
              <Input
                type='number'
                min='0'
                placeholder='0'
                value={views}
                onChange={(e) => setViews(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Percent className='size-3.5' /> 完播率 (%)
              </Label>
              <Input
                type='number'
                step='0.01'
                min='0'
                max='100'
                placeholder='0.00'
                value={completionRate}
                onChange={(e) => setCompletionRate(e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-2'>
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Heart className='size-3.5' /> 点赞
              </Label>
              <Input
                type='number'
                min='0'
                placeholder='0'
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1 text-xs text-muted-foreground'>
                <MessageSquare className='size-3.5' /> 评论
              </Label>
              <Input
                type='number'
                min='0'
                placeholder='0'
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Share2 className='size-3.5' /> 转发
              </Label>
              <Input
                type='number'
                min='0'
                placeholder='0'
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3'>
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs font-medium text-foreground'>
                <ShoppingBag className='size-3.5 text-amber-500' /> 带货成交 (GMV / 元)
              </Label>
              <Input
                type='number'
                step='0.01'
                min='0'
                placeholder='0.00'
                value={gmvYuan}
                onChange={(e) => setGmvYuan(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium text-foreground'>
                出单数量 (单)
              </Label>
              <Input
                type='number'
                min='0'
                placeholder='0'
                value={orderCount}
                onChange={(e) => setOrderCount(e.target.value)}
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs text-muted-foreground'>效果复盘与分析备注</Label>
            <Input
              placeholder='如：前 3 秒黄金钩子抓人，评论区引导互动良好...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type='submit' disabled={createLog.isPending}>
              {createLog.isPending ? '提交中...' : '打卡保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
