import { useState } from 'react'
import { BookPlus, LoaderCircle } from 'lucide-react'
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

export function AddKnowledgeDialog() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('通用')
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !reason.trim()) {
      toast.error('请填写完整案例标题与避坑描述')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await getSupabaseClient()
        .from('failed_cases')
        .insert({
          source_type: department,
          source_id: title.trim(),
          reason: `【${title.trim()}】${reason.trim()}`,
          lessons: reason.trim(),
          recorded_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success('避坑知识已成功录入，可在全局搜索引擎与 AI 助手中即时检索！')
      setTitle('')
      setReason('')
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['team-memory'] })
      void queryClient.invalidateQueries({ queryKey: ['search-results'] })
    } catch {
      toast.error('录入失败，请检查网络或权限')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline' className='gap-1.5'>
          <BookPlus className='size-4 text-primary' />
          录入知识经验
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>录入团队避坑知识与经验</DialogTitle>
            <DialogDescription>
              录入后的经验将即时同步至 Supabase 数据库，支持在全局搜索（Ctrl+K）及各工作台 AI 问答中直接命中。
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='case-title'>经验 / 案例标题</Label>
              <Input
                id='case-title'
                placeholder='例如：TikTok 美区电子类目开店资质避坑'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label>关联业务部门</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder='选择部门' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='通用'>通用 / 跨部门</SelectItem>
                  <SelectItem value='商务'>商务拓展</SelectItem>
                  <SelectItem value='市场'>市场选品</SelectItem>
                  <SelectItem value='设计'>视觉设计</SelectItem>
                  <SelectItem value='剪辑'>短视频剪辑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='case-reason'>避坑复盘与执行建议</Label>
              <Textarea
                id='case-reason'
                rows={4}
                placeholder='详细记录原因与操作指南：如平台规则改动、封号判定、素材违规关键词或推荐的替代方案…'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
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
                  录入中…
                </>
              ) : (
                '保存到知识库'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
