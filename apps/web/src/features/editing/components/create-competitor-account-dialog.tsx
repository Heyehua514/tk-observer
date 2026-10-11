import { useState } from 'react'
import { UserPlus, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getSupabaseClient } from '@/lib/supabase'
import { competitorAccountKeys } from '../hooks/use-competitor-accounts'

export function CreateCompetitorAccountDialog() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('TikTok')
  const [category, setCategory] = useState('电子数码')
  const [followerCount, setFollowerCount] = useState<number>(0)
  const [averageViews, setAverageViews] = useState<number>(0)
  const [profileUrl, setProfileUrl] = useState('')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('请输入对标账号名称')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await getSupabaseClient()
        .from('competitor_accounts')
        .insert({
          name: name.trim(),
          platform,
          category,
          follower_count: followerCount,
          avg_views: averageViews,
          profile_url: profileUrl.trim() || null,
          notes: notes.trim() || null,
        })

      if (error) throw error

      toast.success(`对标账号【${name.trim()}】已创建，已纳入全网监控与知识搜索！`)
      setName('')
      setProfileUrl('')
      setNotes('')
      setFollowerCount(0)
      setAverageViews(0)
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: competitorAccountKeys.all })
    } catch {
      toast.error('创建失败，请检查网络或权限')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' className='gap-1.5'>
          <UserPlus className='size-4' />
          添加对标账号
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新建对标监控账号</DialogTitle>
            <DialogDescription>
              支持录入 TikTok、抖音或微信视频号头部账号，用于分析爆款钩子与剪辑手法。
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='account-name'>账号名称 / 达人昵称</Label>
              <Input
                id='account-name'
                placeholder='例如：AnkerOfficial 或 磊哥跨境实战'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>所属平台</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder='选择平台' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='TikTok'>TikTok</SelectItem>
                    <SelectItem value='抖音'>抖音</SelectItem>
                    <SelectItem value='微信视频号'>微信视频号</SelectItem>
                    <SelectItem value='YouTube'>YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>对标类目</Label>
                <Input
                  placeholder='例如：美妆护肤、电子、家居'
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>粉丝数</Label>
                <Input
                  type='number'
                  min={0}
                  value={followerCount}
                  onChange={(e) => setFollowerCount(Number(e.target.value) || 0)}
                />
              </div>

              <div className='space-y-2'>
                <Label>平均播放量</Label>
                <Input
                  type='number'
                  min={0}
                  value={averageViews}
                  onChange={(e) => setAverageViews(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='profile-url'>主页链接 (可选)</Label>
              <Input
                id='profile-url'
                type='url'
                placeholder='https://www.tiktok.com/@...'
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='notes'>对标亮点 / 运营备注</Label>
              <Textarea
                id='notes'
                rows={3}
                placeholder='核心看点：前3秒钩子强、实景口播、带货转化高…'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className='mr-1.5 size-4 animate-spin' />
                  创建中…
                </>
              ) : (
                '确认添加'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
