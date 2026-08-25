/**
 * 通用 AI 助手面板：可在多个工作台复用，通过本机 WorkBuddy 执行调研/文案/复盘等。
 * 流程：选任务类型 + 填需求 → 调本机网关 → 展示结果（人工确认保留）。
 * 所属工作台：全局（商务/市场/设计/剪辑等均可复用）。
 */
import { useRef, useState } from 'react'
import {
  Check,
  ClipboardCopy,
  LoaderCircle,
  Save,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getSupabaseClient } from '@/lib/supabase'
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
import { useAiWorkspaceContext } from '@/features/shared-ai/hooks/use-ai-workspace-context'
import { callWorkBuddyGateway } from '@/features/shared-ai/workbuddy-gateway'
import { rankAiMemories } from './ai-memory-ranking'
import { getAiProfile } from './ai-profile'
import { buildWorkspaceAiPrompt } from './ai-workspace-context'
import { useAiMemory } from './hooks/use-ai-memory'

export type AiTaskType = '调研' | '文案' | '总结复盘' | '分析' | '自定义'
const TASK_TYPES: AiTaskType[] = ['调研', '文案', '总结复盘', '分析', '自定义']

export function AiAssistantPanel({
  scope,
  context,
  initialPrompt,
}: {
  scope: string
  context?: string
  initialPrompt?: string
}) {
  const role = useAuthStore((state) => state.user?.role)
  const profile = getAiProfile(role)
  const memories = useAiMemory()
  const [prompt, setPrompt] = useState(initialPrompt || '')
  const [taskType, setTaskType] = useState<AiTaskType>('分析')
  const rankedMemories = rankAiMemories(memories.data, scope, taskType)
  const workspaceContext = useAiWorkspaceContext(scope)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [missingSources, setMissingSources] = useState<string[]>([])
  const inFlight = useRef(false)

  const run = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setResult(null)
    setMissingSources([])
    try {
      const workspace = await workspaceContext.load()
      setMissingSources(workspace.missingSources)
      const fullPrompt = buildWorkspaceAiPrompt({
        scope,
        role: role || 'unknown',
        request: `${taskType}：${prompt}`,
        memories: rankedMemories,
        items: [
          ...workspace.items,
          ...(context
            ? [
                {
                  kind: '当前页面摘要',
                  title: context,
                  status: '当前页面',
                },
              ]
            : []),
        ],
        missingSources: workspace.missingSources,
      })
      const text = await callWorkBuddyGateway(fullPrompt)
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

  const saveNote = async () => {
    if (!result || saving) return
    setSaving(true)
    try {
      const user = useAuthStore.getState().user
      const supabase = getSupabaseClient()
      const insertFn = supabase.from.bind(supabase) as unknown as (
        table: string
      ) => {
        insert(
          data: Record<string, unknown>
        ): Promise<{ error: { message: string } | null }>
      }
      const { error } = await insertFn('ai_notes').insert({
        scope,
        task_type: taskType,
        prompt,
        result,
        owner_id: user?.id ?? null,
      })
      if (error) throw error
      toast.success('已保存到 AI 记录')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const rememberResult = async () => {
    if (!result || memories.isPending) return
    try {
      await memories.save({
        memoryType: 'accepted_ai',
        memoryKey: `${scope}:${taskType}`,
        memoryValue: result.slice(0, 2000),
        confidence: 0.7,
        source: 'accepted_ai',
      })
      toast.success('已记住这条建议')
    } catch {
      toast.error('记忆保存失败')
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
          <span>AI 助手（WorkBuddy）</span>
          <span className='rounded-full border px-2 py-0.5 text-xs font-normal text-muted-foreground'>
            {profile.assistantName}
          </span>
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
        <p className='text-xs text-muted-foreground'>
          当前重点：{profile.focus.join('、')}
        </p>
        {missingSources.length ? (
          <p className='text-xs text-amber-700 dark:text-amber-300'>
            {missingSources.join('、')}
            数据暂不可用，本次建议不会把缺失数据视为零。
          </p>
        ) : null}
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
              <Button
                size='sm'
                variant='outline'
                onClick={() => void saveNote()}
                disabled={saving}
              >
                <Save />
                {saving ? '保存中…' : '保存到记录'}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => void rememberResult()}
                disabled={memories.isPending}
              >
                <Sparkles />
                记住这条
              </Button>
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
