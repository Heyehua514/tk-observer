/**
 * 通用 AI 助手面板：可在多个工作台复用，通过本机 WorkBuddy 执行调研/文案/复盘等。
 * 流程：选任务类型 + 填需求 → 调本机网关 → 展示结果（人工确认保留）。
 * 所属工作台：全局（商务/市场/设计/剪辑等均可复用）。
 */
import { useRef, useState } from 'react'
import { Check, ClipboardCopy, LoaderCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type AiTaskType = '调研' | '文案' | '总结复盘' | '分析' | '自定义'
const TASK_TYPES: AiTaskType[] = ['调研', '文案', '总结复盘', '分析', '自定义']

export function AiAssistantPanel({
  scope,
  context,
}: {
  scope: string
  context?: string
}) {
  const [prompt, setPrompt] = useState('')
  const [taskType, setTaskType] = useState<AiTaskType>('分析')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inFlight = useRef(false)

  const run = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setResult(null)
    try {
      const fullPrompt = [
        `工作台：${scope}；任务类型：${taskType}。`,
        context ? `以下是当前页面/工作台相关数据，供你参考：\n${context}` : '',
        prompt,
        '请给出清晰、可直接使用的中文结果。只输出结果本身，不要提问或寒暄。',
      ]
        .filter(Boolean)
        .join('\n')
      const text = await callGateway(fullPrompt)
      setResult(text)
      toast.success('AI 已完成，请确认是否采用')
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === 'GATEWAY_UNAVAILABLE'
          ? '未检测到本机 WorkBuddy 网关，请先双击「启动WorkBuddy网关.command」'
          : 'AI 调用失败，请检查 WorkBuddy 状态'
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <Card className='bento-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Sparkles className='size-4 text-primary' />
          AI 助手（WorkBuddy）
        </CardTitle>
        <CardDescription>
          由你本机的 WorkBuddy 执行，会消耗你的额度；结果需你人工确认后再采用。
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3 sm:grid-cols-[200px_1fr]'>
          <div>
            <Label>任务类型</Label>
            <Select
              value={taskType}
              onValueChange={(v) => setTaskType(v as AiTaskType)}
            >
              <SelectTrigger>
                <SelectValue placeholder='选择任务类型' />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>需求描述</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='例如：调研 TikTok 美区美妆类目 7 月畅销品，给出 Top 5 与共性。'
            />
          </div>
        </div>
        <Button
          onClick={() => void run()}
          disabled={busy || !prompt.trim()}
          className='w-full'
        >
          {busy ? (
            <>
              <LoaderCircle className='size-4 animate-spin' />
              WorkBuddy 执行中…
            </>
          ) : (
            <>
              <Sparkles className='size-4' />让 WorkBuddy 执行
            </>
          )}
        </Button>
        {result && (
          <div className='space-y-2'>
            <div className='flex justify-end gap-2'>
              <Button size='sm' variant='outline' onClick={() => void copy()}>
                {copied ? <Check /> : <ClipboardCopy />}
                {copied ? '已复制' : '复制结果'}
              </Button>
            </div>
            <pre className='max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap'>
              {result}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function callGateway(prompt: string): Promise<string> {
  const endpoint =
    localStorage.getItem('tk.workbuddy.gateway') ||
    'http://127.0.0.1:8877/analyze'
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
