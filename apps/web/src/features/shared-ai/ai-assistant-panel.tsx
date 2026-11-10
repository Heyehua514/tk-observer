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
import { searchDifyKnowledge } from '@/lib/dify-client'
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
type AiRequestPhase = 'idle' | 'workspace' | 'knowledge' | 'model'
const TASK_TYPES: AiTaskType[] = ['调研', '文案', '总结复盘', '分析', '自定义']

function getAiErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  if (code === 'AI_AUTH_REQUIRED')
    return '登录状态已失效，请刷新页面并重新登录后再试。'
  if (code === 'AI_NOT_CONFIGURED')
    return '云端 AI 尚未配置，请联系管理员检查模型服务。'
  if (code === 'AI_UPSTREAM_FAILED') return '云端模型暂时不可用，请稍后重试。'
  if (code === 'AI_TIMEOUT') return 'AI 请求超时。可缩短问题或稍后重试。'
  if (code === 'AI_INVALID_RESPONSE') return 'AI 服务返回了空结果，请重试。'
  if (code === 'AI_CLOUD_UNAVAILABLE')
    return '云端 AI 暂不可达，且本机 WorkBuddy 不可用。'
  if (code === 'GATEWAY_UNAVAILABLE')
    return '本机 WorkBuddy 与云端 AI 均不可用，请检查客户端登录和网络。'
  return 'AI 请求失败，请检查网络和 WorkBuddy/云端 AI 服务。'
}

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
  const [resultContext, setResultContext] = useState<{
    scope: string
    taskType: AiTaskType
    prompt: string
  } | null>(null)
  const [remembering, setRemembering] = useState(false)
  const [memoryFeedback, setMemoryFeedback] = useState<{
    error: boolean
    message: string
  } | null>(null)
  const memoryInFlight = useRef(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [missingSources, setMissingSources] = useState<string[]>([])
  const [phase, setPhase] = useState<AiRequestPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inFlight = useRef(false)

  const run = async () => {
    if (inFlight.current || memoryInFlight.current) return
    inFlight.current = true
    setBusy(true)
    setPhase('workspace')
    setResult(null)
    setResultContext(null)
    setMemoryFeedback(null)
    setMissingSources([])
    setErrorMessage(null)
    try {
      const workspace = await workspaceContext.load()
      setMissingSources(workspace.missingSources)
      setPhase('knowledge')
      const difyKnowledge = await searchDifyKnowledge({
        query: `${taskType} ${prompt}`,
        topK: 3,
      })
      const fullPrompt = buildWorkspaceAiPrompt({
        knowledgeItems: difyKnowledge.map((k) => ({
          title: k.title,
          content: k.content,
        })),
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
      setPhase('model')
      const text = await callWorkBuddyGateway(fullPrompt)
      setResult(text)
      setResultContext({ scope, taskType, prompt })
      toast.success('AI 已完成，请确认是否采用')
    } catch (e) {
      const message = getAiErrorMessage(e)
      setErrorMessage(message)
      toast.error(message)
    } finally {
      inFlight.current = false
      setBusy(false)
      setPhase('idle')
    }
  }

  const saveNote = async () => {
    if (!result || !resultContext || saving) return
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
        scope: resultContext.scope,
        task_type: resultContext.taskType,
        prompt: resultContext.prompt,
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
    if (!result || !resultContext || memoryInFlight.current) return
    memoryInFlight.current = true
    setRemembering(true)
    setMemoryFeedback(null)
    try {
      await memories.save({
        memoryType: 'accepted_ai',
        memoryKey: `${resultContext.scope}:${resultContext.taskType}`,
        memoryValue: Array.from(result).slice(0, 2000).join(''),
        confidence: 0.7,
        source: 'accepted_ai',
      })
      toast.success('已记住这条建议')
      setMemoryFeedback({
        error: false,
        message: '已记住这条建议，同类记忆已更新。',
      })
    } catch {
      toast.error('记忆保存失败')
      setMemoryFeedback({
        error: true,
        message: '记忆保存失败，分析结果已保留，请重试。',
      })
    } finally {
      memoryInFlight.current = false
      setRemembering(false)
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
          <span>AI 助手（WorkBuddy / DeepSeek）</span>
          <span className='rounded-full border px-2 py-0.5 text-xs font-normal text-muted-foreground'>
            {profile.assistantName}
          </span>
        </CardTitle>
        <CardDescription>
          优先使用本机 WorkBuddy；本机不可用时切换云端
          DeepSeek。云端调用可能产生模型费用，结果需人工确认后采用。
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
          disabled={busy || remembering || !prompt.trim()}
          className='w-full'
        >
          {busy ? (
            <>
              <LoaderCircle className='size-4 animate-spin' />
              {phase === 'workspace'
                ? '正在读取工作台数据…'
                : phase === 'knowledge'
                  ? '正在检索企业知识库…'
                  : '正在调用 AI…'}
            </>
          ) : (
            <>
              <Sparkles className='size-4' />让 WorkBuddy 执行
            </>
          )}
        </Button>
        {errorMessage && (
          <p role='alert' className='text-sm text-destructive'>
            {errorMessage}
          </p>
        )}
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
                disabled={remembering || memories.isSaving}
              >
                <Sparkles />
                {remembering ? '正在记住…' : '记住这条'}
              </Button>
              <Button size='sm' variant='outline' onClick={() => void copy()}>
                {copied ? <Check /> : <ClipboardCopy />}
                {copied ? '已复制' : '复制结果'}
              </Button>
            </div>
            {memoryFeedback && (
              <p
                role={memoryFeedback.error ? 'alert' : 'status'}
                className={
                  memoryFeedback.error
                    ? 'text-sm text-destructive'
                    : 'text-sm text-muted-foreground'
                }
              >
                {memoryFeedback.message}
              </p>
            )}
            <pre className='max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap'>
              {result}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
