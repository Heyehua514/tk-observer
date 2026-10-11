import { useState } from 'react'
import { Sparkles, LoaderCircle, CheckCircle2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { getSupabaseClient } from '@/lib/supabase'
import { callWorkBuddyGateway } from '@/features/shared-ai/workbuddy-gateway'
import type { CompetitorAccount } from '../types'

export function AiViralAnalysisButton({ account }: { account: CompetitorAccount }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const handleRunAnalysis = async () => {
    setLoading(true)
    setAnalysis(null)
    try {
      const prompt = `你是跨境短视频爆款拆解专家。请针对以下对标账号进行深度剖析：
账号名称：${account.name}
平台：${account.platform}
类目：${account.category}
粉丝数：${account.followerCount}
平均播放量：${account.averageViews}
运营备注：${account.notes || '无'}

请从以下 4 个维度给出可执行建议：
1. 【前3秒黄金钩子策略】：分析该类目最容易抓取完播率的开场手法；
2. 【爆款选题模型】：列出适合该账号调性的 3 个高流量选题角度；
3. 【文案与情绪价值】：剖析高转化脚本的情绪推进节奏；
4. 【对我们团队的落地建议】：我们该如何低成本复制并做出差异化。`

      const result = await callWorkBuddyGateway(prompt)
      setAnalysis(result)
      toast.success('AI 爆款拆解完成！')
    } catch {
      toast.error('AI 拆解失败，请确保本地 WorkBuddy 或大模型网关运行正常')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToKnowledge = async () => {
    if (!analysis) return
    try {
      const { error } = await getSupabaseClient().from('failed_cases').insert({
        source_type: '剪辑',
        source_id: account.name,
        reason: `【${account.platform}对标·${account.name}】${analysis.slice(0, 150)}...`,
        lessons: analysis,
        recorded_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success('已作为爆款分析模型沉淀至企业知识库！')
      void queryClient.invalidateQueries({ queryKey: ['team-memory'] })
      void queryClient.invalidateQueries({ queryKey: ['search-results'] })
      setOpen(false)
    } catch {
      toast.error('沉淀到知识库失败，请检查网络')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline' className='gap-1.5 text-primary hover:text-primary'>
          <Sparkles className='size-4' />
          AI 爆款拆解
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <DialogTitle>AI 智能爆款拆解 · {account.name}</DialogTitle>
            <Badge variant='outline'>{account.platform}</Badge>
          </div>
          <DialogDescription>
            利用大模型/WorkBuddy 深度拆解该对标账号的流量密码，并可一键沉淀为企业知识库经验。
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-3'>
          {!analysis && !loading && (
            <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
              点击下方按钮，启动对标爆款基因分析（黄金前3秒、高完播选题、情绪共鸣与落地策略）。
            </div>
          )}

          {loading && (
            <div className='flex flex-col items-center justify-center py-10 space-y-3'>
              <LoaderCircle className='size-6 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>正在深度剖析对标账号流量模型与受众心智…</p>
            </div>
          )}

          {analysis && (
            <div className='rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap font-sans'>
              {analysis}
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          {!analysis ? (
            <Button onClick={handleRunAnalysis} disabled={loading} className='w-full sm:w-auto'>
              {loading ? '正在分析…' : '立即执行 AI 拆解'}
            </Button>
          ) : (
            <div className='flex w-full justify-between items-center'>
              <Button variant='outline' onClick={handleRunAnalysis} disabled={loading}>
                重新分析
              </Button>
              <div className='flex gap-2'>
                <Button variant='secondary' onClick={() => setOpen(false)}>
                  关闭
                </Button>
                <Button onClick={handleSaveToKnowledge} className='gap-1.5'>
                  <CheckCircle2 className='size-4' />
                  一键沉淀至知识库
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
