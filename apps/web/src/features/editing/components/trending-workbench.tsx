/**
 * 热点话题追踪页面。
 * 路由：/editing?section=trends；权限：editing, boss。
 * 不调用微信视频号 API，仅解析用户从 AI 助手粘贴的调研结果。
 */
import { useMemo, useState } from 'react'
import { ArrowRight, Copy, SearchCheck } from 'lucide-react'
import { toast } from 'sonner'
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { SearchBar } from '@/components/shared/search-bar'
import { heatLevels } from '../constants'
import {
  useCreateTrendingTopic,
  useMarkTrendingTopicConverted,
} from '../hooks/use-create-trending-topic'
import { useTrendingTopics } from '../hooks/use-trending-topics'
import type {
  TrendingTopic,
  TrendingTopicInput,
  VideoIdeaInput,
} from '../types'

function parseTopicBlocks(text: string): TrendingTopicInput[] {
  const blocks = text
    .split(/\n\s*(?:---+|\n)\s*\n?/u)
    .map((block) => block.trim())
    .filter(Boolean)
  return blocks.map((block) => {
    const fields = new Map<string, string>()
    let fallbackTitle = ''
    const insightLines: string[] = []
    for (const raw of block.split(/\r?\n/u)) {
      const line = raw.replace(/^[-*#\d.、\s]+/u, '').trim()
      if (!line) continue
      const matched = line.match(
        /^(话题|来源|关键词|热度|启发|选题启发|链接|参考链接)[：:]\s*(.*)$/u
      )
      if (matched) fields.set(matched[1], matched[2].trim())
      else if (!fallbackTitle) fallbackTitle = line
      else insightLines.push(line)
    }
    const topic = fields.get('话题') || fallbackTitle
    if (!topic) throw new Error('每条调研结果都需要话题名称')
    const rawHeat = fields.get('热度') || '中'
    const heatLevel = heatLevels.includes(
      rawHeat as (typeof heatLevels)[number]
    )
      ? (rawHeat as TrendingTopicInput['heatLevel'])
      : '中'
    return {
      topic,
      source: fields.get('来源') || 'AI 辅助行业调研',
      keywords: fields.get('关键词') || '',
      heatLevel,
      insight:
        fields.get('启发') || fields.get('选题启发') || insightLines.join('\n'),
      referenceUrl: fields.get('链接') || fields.get('参考链接') || '',
      discoveredAt: new Date().toISOString().slice(0, 10),
    }
  })
}

function TrendResearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [direction, setDirection] = useState('TikTok 跨境电商最近什么话题火')
  const [result, setResult] = useState('')
  const createTopic = useCreateTrendingTopic()
  const prompt = useMemo(
    () =>
      `请调研：${direction}。聚焦出海跨境、电商运营和内容创作，输出 3-8 个可拍摄话题。每条严格使用以下格式并用 --- 分隔：\n话题：\n来源：\n关键词：用逗号分隔\n热度：高/中/低\n选题启发：\n参考链接：`,
    [direction]
  )
  const save = async () => {
    try {
      const topics = parseTopicBlocks(result)
      for (const topic of topics) await createTopic.mutateAsync(topic)
      setResult('')
      onOpenChange(false)
      toast.success(`已保存 ${topics.length} 条热点话题`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '调研结果解析失败')
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>调研趋势</DialogTitle>
          <DialogDescription>
            微信视频号没有公开 API。请将问题发给 Codex、ChatGPT 等 AI
            助手，再把结构化结果粘贴回来。
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div>
            <label
              className='mb-2 block text-sm font-medium'
              htmlFor='trend-direction'
            >
              调研方向
            </label>
            <Input
              id='trend-direction'
              value={direction}
              onChange={(event) => setDirection(event.target.value)}
            />
          </div>
          <div className='rounded-lg border bg-muted/40 p-4 text-sm whitespace-pre-wrap'>
            {prompt}
          </div>
          <Button
            variant='outline'
            onClick={() =>
              void navigator.clipboard
                .writeText(prompt)
                .then(() => toast.success('调研提示词已复制'))
            }
          >
            <Copy className='size-4' />
            复制提示词
          </Button>
          <div>
            <label
              className='mb-2 block text-sm font-medium'
              htmlFor='trend-result'
            >
              AI 调研结果
            </label>
            <Textarea
              id='trend-result'
              rows={12}
              value={result}
              onChange={(event) => setResult(event.target.value)}
              placeholder='粘贴结构化调研结果'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => void save()}
            disabled={!result.trim() || createTopic.isPending}
          >
            解析并保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TrendingWorkbench({
  query,
  onQueryChange,
  onConvert,
}: {
  query: string
  onQueryChange: (query: string) => void
  onConvert: (topic: TrendingTopic, initial: Partial<VideoIdeaInput>) => void
}) {
  const [researchOpen, setResearchOpen] = useState(false)
  const topics = useTrendingTopics(query)
  const markConverted = useMarkTrendingTopicConverted()
  const convert = (topic: TrendingTopic) => {
    onConvert(topic, {
      title: topic.topic,
      description: topic.insight,
      tags: topic.keywords,
      sourceUrl: topic.referenceUrl,
      publishDate: new Date().toISOString().slice(0, 10),
    })
    if (!topic.convertedToIdea) markConverted.mutate(topic.id)
  }
  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SearchBar
          value={query}
          onChange={onQueryChange}
          placeholder='搜索话题、关键词或选题启发'
        />
        <Button onClick={() => setResearchOpen(true)}>
          <SearchCheck className='size-4' />
          调研趋势
        </Button>
      </div>
      {topics.isError ? (
        <EmptyState
          title='热点话题加载失败'
          description='请检查 PocketBase 连接和账号权限。'
        />
      ) : topics.data?.length ? (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {topics.data.map((topic) => (
            <article
              key={topic.id}
              className='flex min-h-64 flex-col rounded-lg border bg-card p-5'
            >
              <div className='flex items-start justify-between gap-3'>
                <h3 className='font-semibold'>{topic.topic}</h3>
                <Badge
                  className={
                    topic.heatLevel === '高'
                      ? 'bg-red-600'
                      : topic.heatLevel === '中'
                        ? 'bg-amber-600'
                        : 'bg-slate-600'
                  }
                >
                  {topic.heatLevel}热度
                </Badge>
              </div>
              <p className='mt-3 line-clamp-4 text-sm text-muted-foreground'>
                {topic.insight || '暂无选题启发'}
              </p>
              <div className='mt-4 flex flex-wrap gap-2'>
                {topic.keywords
                  .split(/[,，]/u)
                  .filter(Boolean)
                  .map((keyword) => (
                    <Badge key={keyword} variant='secondary'>
                      {keyword.trim()}
                    </Badge>
                  ))}
              </div>
              <div className='mt-auto flex items-end justify-between gap-3 pt-5'>
                <div className='text-xs text-muted-foreground'>
                  {topic.source}
                  <br />
                  {topic.discoveredAt}
                </div>
                <Button
                  size='sm'
                  variant={topic.convertedToIdea ? 'outline' : 'default'}
                  onClick={() => convert(topic)}
                >
                  {topic.convertedToIdea ? '再次转为选题' : '转为选题'}
                  <ArrowRight className='size-4' />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title='暂无热点话题'
          description='点击“调研趋势”，把行业调研结果粘贴回来并保存。'
          action={
            <Button onClick={() => setResearchOpen(true)}>
              <SearchCheck className='size-4' />
              调研趋势
            </Button>
          }
        />
      )}
      {topics.data?.length ? (
        <p className='text-sm text-muted-foreground'>
          数据更新于{' '}
          {formatBeijingTime(
            topics.data
              .map((topic) => topic.updated)
              .reduce(
                (latest, current) => (current > latest ? current : latest),
                ''
              )
          )}
        </p>
      ) : null}
      <TrendResearchDialog open={researchOpen} onOpenChange={setResearchOpen} />
    </div>
  )
}
