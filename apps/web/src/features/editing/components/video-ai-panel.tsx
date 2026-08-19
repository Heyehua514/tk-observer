/** 视频 AI 分析面板：调 WorkBuddy 分析一批并回写（人工触发）。 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buildVideoAnalysisPrompt,
  parseVideoAnalysisJson,
} from '../ai-assistant/workbuddy-runner'
import { BoundOutput } from './workbuddy-preview'

type VideoForAnalysis = {
  id: string
  title: string
  videoType: string
  publishDate: string
  views: number
}

export function VideoAiPanel() {
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState<string | null>(null)
  const candidates = useQuery({
    queryKey: ['editing', 'videoIdeas', 'ai-candidates'],
    queryFn: async (): Promise<VideoForAnalysis[]> => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('video_ideas')
          .select('id,title,video_type,publish_date,views')
          .is('deleted_at', null)
          .order('publish_date', { ascending: false })
          .limit(50)
        if (error) throw error
        return (data || []).map((r) => ({
          id: String(r.id),
          title: String(r.title),
          videoType: String(r.video_type),
          publishDate: String(r.publish_date || '').slice(0, 10),
          views: Number(r.views || 0),
        }))
      }
      const records = await pb.collection('video_ideas').getFullList({
        sort: '-publish_date',
      })
      return records.slice(0, 50).map((r) => ({
        id: String(r.id),
        title: String(r.title),
        videoType: String(r.video_type),
        publishDate: String(r.publish_date || '').slice(0, 10),
        views: Number(r.views || 0),
      }))
    },
  })

  const analyze = useMutation({
    mutationFn: async (): Promise<string> => {
      const videos = candidates.data ?? []
      if (!videos.length) throw new Error('NO_DATA')
      const prompt = buildVideoAnalysisPrompt(videos)
      const raw = await runWorkBuddy(prompt)
      const parsed = parseVideoAnalysisJson(raw)
      const text = JSON.stringify(parsed, null, 2)
      // 写回：每个视频写入同一份结构化分析（可在后续改成逐条）。
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        const call = supabase.rpc(
          'write_video_idea_analysis' as never
        ) as unknown as (args: {
          target_id: string
          analysis: string
          analyzed: string
        }) => Promise<{ error: { message: string } | null }>
        for (const v of videos) {
          const { error } = await call({
            target_id: v.id,
            analysis: text,
            analyzed: new Date().toISOString(),
          })
          if (error) throw error
        }
      }
      setPreview(text)
      void queryClient.invalidateQueries({ queryKey: videoIdeaInvalidKeys })
      return text
    },
    onSuccess: () => toast.success('分析完成，已写入'),
    onError: (e) =>
      toast.error(
        e instanceof Error && e.message === 'NO_DATA'
          ? '还没有视频数据可分析'
          : '分析失败，请确认 WorkBuddy 已登录'
      ),
  })

  return (
    <Card className='bento-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Sparkles className='size-4 text-primary' />
          视频 AI 分析（WorkBuddy）
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-sm text-muted-foreground'>
          共 {candidates.data?.length ?? 0} 条视频待分析。点击后由 WorkBuddy
          分析标题规律、发布时间与内容偏好，结果供你人工确认。
        </p>
        <Button
          onClick={() => void analyze.mutate()}
          disabled={analyze.isPending}
        >
          {analyze.isPending && (
            <LoaderCircle className='size-4 animate-spin' />
          )}
          {analyze.isPending ? 'WorkBuddy 分析中…' : '开始分析'}
        </Button>
        <BoundOutput value={preview} />
      </CardContent>
    </Card>
  )
}

const videoIdeaInvalidKeys = ['editing', 'videoIdeas'] as const

async function runWorkBuddy(prompt: string): Promise<string> {
  const endpoint =
    localStorage.getItem('tk.workbuddy.gateway') || 'http://127.0.0.1:8877/analyze'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!response.ok) throw new Error('GATEWAY_UNAVAILABLE')
  const data = (await response.json()) as { ok: boolean; text?: string }
  if (!data.ok || !data.text) throw new Error('GATEWAY_UNAVAILABLE')
  return data.text
}
