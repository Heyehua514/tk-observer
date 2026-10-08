/** 达人触达跟进时间线与登记组件。 */
import { useState } from 'react'
import {
  Clock,
  History,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Send,
  User,
} from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  cooperationStatuses,
  cooperationStatusLabels,
  followUpChannels,
  followUpChannelLabels,
} from '../constants'
import { useCreateCreatorFollowUp } from '../hooks/use-create-creator-follow-up'
import { useCreatorFollowUps } from '../hooks/use-creator-follow-ups'
import type {
  CooperationStatus,
  Creator,
  FollowUpChannel,
} from '../types'

function ChannelIcon({ channel }: { channel: FollowUpChannel }) {
  switch (channel) {
    case 'whatsapp':
    case 'tiktok_dm':
      return <MessageCircle className='size-3.5 text-emerald-500' />
    case 'email':
      return <Mail className='size-3.5 text-blue-500' />
    case 'phone':
      return <Phone className='size-3.5 text-amber-500' />
    default:
      return <Send className='size-3.5 text-purple-500' />
  }
}

export function CreatorFollowUpTimeline({ creator }: { creator: Creator }) {
  const followUps = useCreatorFollowUps(creator.id)
  const createFollowUp = useCreateCreatorFollowUp()
  const [dialogOpen, setDialogOpen] = useState(false)

  // 表单状态
  const [channel, setChannel] = useState<FollowUpChannel>('whatsapp')
  const [status, setStatus] = useState<CooperationStatus>(
    creator.cooperationStatus || 'contacting'
  )
  const [operatorName, setOperatorName] = useState(creator.owner || '董雨辰')
  const [summary, setSummary] = useState('')
  const [nextFollowUpAt, setNextFollowUpAt] = useState('')

  const handleOpen = (open: boolean) => {
    if (open) {
      setStatus(creator.cooperationStatus || 'contacting')
      setOperatorName(creator.owner || '董雨辰')
      setSummary('')
      setNextFollowUpAt('')
    }
    setDialogOpen(open)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) return

    await createFollowUp.mutateAsync({
      creatorId: creator.id,
      channel,
      status,
      operatorName,
      summary: summary.trim(),
      contactedAt: new Date().toISOString(),
      nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
    })
    setDialogOpen(false)
  }

  return (
    <section className='border-t pt-5'>
      <div className='flex items-center justify-between'>
        <h3 className='flex items-center gap-2 text-sm font-medium'>
          <History className='size-4' />
          触达与跟进记录
          {followUps.data?.length ? (
            <span className='rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'>
              {followUps.data.length}
            </span>
          ) : null}
        </h3>
        <Dialog open={dialogOpen} onOpenChange={handleOpen}>
          <DialogTrigger asChild>
            <Button size='sm' variant='outline' className='h-8 text-xs'>
              <Plus className='size-3.5' />
              登记跟进
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>登记触达跟进</DialogTitle>
              <DialogDescription>
                记录与 {creator.nickname} 的沟通结论并更新当前合作状态。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4 py-2'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <Label htmlFor='follow-up-channel'>沟通渠道</Label>
                  <Select
                    value={channel}
                    onValueChange={(val) => setChannel(val as FollowUpChannel)}
                  >
                    <SelectTrigger id='follow-up-channel'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {followUpChannels.map((item) => (
                        <SelectItem key={item} value={item}>
                          {followUpChannelLabels[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='follow-up-status'>最新合作状态</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as CooperationStatus)}
                  >
                    <SelectTrigger id='follow-up-status'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperationStatuses.map((item) => (
                        <SelectItem key={item} value={item}>
                          {cooperationStatusLabels[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <Label htmlFor='follow-up-operator'>对接人员</Label>
                  <Input
                    id='follow-up-operator'
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder='对接人姓名'
                    required
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='follow-up-next-time'>下次预约跟进</Label>
                  <Input
                    id='follow-up-next-time'
                    type='datetime-local'
                    value={nextFollowUpAt}
                    onChange={(e) => setNextFollowUpAt(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='follow-up-summary'>
                  沟通要点与结论 <span className='text-destructive'>*</span>
                </Label>
                <Textarea
                  id='follow-up-summary'
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder='如：达人认可报价，已寄出样品并约定下周二复盘脚本意向...'
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  取消
                </Button>
                <Button type='submit' disabled={createFollowUp.isPending || !summary.trim()}>
                  {createFollowUp.isPending ? '提交中...' : '保存记录'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='mt-3'>
        {followUps.isLoading ? (
          <p className='text-xs text-muted-foreground'>正在加载跟进历史…</p>
        ) : followUps.data?.length ? (
          <div className='relative space-y-4 pl-4 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-0.5 before:bg-muted'>
            {followUps.data.map((item) => (
              <div key={item.id} className='relative rounded-lg border bg-card p-3 text-xs'>
                <div className='absolute -left-[1.35rem] top-3.5 size-2 rounded-full border-2 border-background bg-primary' />
                <div className='flex flex-wrap items-center justify-between gap-1'>
                  <div className='flex items-center gap-1.5'>
                    <ChannelIcon channel={item.channel} />
                    <span className='font-medium'>
                      {followUpChannelLabels[item.channel] || item.channel}
                    </span>
                    <Badge variant='outline' className='text-[10px] px-1 py-0'>
                      {cooperationStatusLabels[item.status] || item.status}
                    </Badge>
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    {formatBeijingTime(item.contactedAt)}
                  </span>
                </div>

                <p className='mt-2 whitespace-pre-wrap break-words text-foreground'>
                  {item.summary}
                </p>

                <div className='mt-2 flex flex-wrap items-center justify-between border-t pt-1.5 text-[11px] text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <User className='size-3' />
                    {item.operatorName}
                  </span>
                  {item.nextFollowUpAt ? (
                    <span className='flex items-center gap-1 text-primary font-medium'>
                      <Clock className='size-3' />
                      预约下次: {formatBeijingTime(item.nextFollowUpAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='rounded-lg border border-dashed p-4 text-center'>
            <p className='text-xs text-muted-foreground'>暂无跟进记录</p>
            <p className='mt-1 text-[11px] text-muted-foreground'>
              点击“登记跟进”沉淀首次沟通意向与节点排期
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
