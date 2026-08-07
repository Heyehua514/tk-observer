/** 对标账号风格分析面板：生成提示词、解析粘贴结果并追加历史版本。 */
import { useMemo, useState } from 'react'
import { Copy, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { styleAnalysisSections } from '../constants'
import { useCreateStyleAnalysis } from '../hooks/use-create-style-analysis'
import type { CompetitorAccount, CompetitorStyleAnalysisInput } from '../types'

type AnalysisFields = Omit<
  CompetitorStyleAnalysisInput,
  'competitorId' | 'analyzedAt'
>

function parseStyleAnalysis(text: string): AnalysisFields {
  const values: AnalysisFields = {
    contentStyle: '',
    titlePattern: '',
    hookMethod: '',
    editingStyle: '',
    viralFactors: '',
    applicableToUs: '',
  }
  const aliases: Array<[keyof AnalysisFields, RegExp]> = [
    ['contentStyle', /^(?:\d+[.、]\s*)?内容(?:定位|风格)[：:]?\s*(.*)$/u],
    ['titlePattern', /^(?:\d+[.、]\s*)?标题套路[：:]?\s*(.*)$/u],
    ['hookMethod', /^(?:\d+[.、]\s*)?(?:开头)?钩子(?:手法)?[：:]?\s*(.*)$/u],
    ['editingStyle', /^(?:\d+[.、]\s*)?剪辑(?:风格|手法)[：:]?\s*(.*)$/u],
    ['viralFactors', /^(?:\d+[.、]\s*)?爆款因素(?:分析)?[：:]?\s*(.*)$/u],
    [
      'applicableToUs',
      /^(?:\d+[.、]\s*)?(?:对\s*TK观察的)?(?:可借鉴)?建议[：:]?\s*(.*)$/u,
    ],
  ]
  let active: keyof AnalysisFields = 'contentStyle'
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.replace(/^#+\s*/u, '').trim()
    if (!line) continue
    const matched = aliases.find(([, pattern]) => pattern.test(line))
    if (matched) {
      active = matched[0]
      const content = line.match(matched[1])?.[1]?.trim() || ''
      if (content) values[active] = content
    } else {
      values[active] = `${values[active]}${values[active] ? '\n' : ''}${line}`
    }
  }
  return values
}

export function StyleAnalysisDialog({
  account,
  open,
  onOpenChange,
}: {
  account: CompetitorAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [result, setResult] = useState('')
  const createAnalysis = useCreateStyleAnalysis()
  const prompt = useMemo(
    () =>
      account
        ? `请分析【${account.name}】的视频内容风格，包括：内容定位、标题套路、开头钩子手法、剪辑风格、爆款因素。结合出海跨境行业背景，给出对 TK观察三个微信视频号账号的可借鉴建议。请按“内容风格、标题套路、钩子手法、剪辑手法、爆款因素、对 TK观察的可借鉴建议”六个标题分段回答。`
        : '',
    [account]
  )
  if (!account) return null
  const save = async () => {
    if (!result.trim()) {
      toast.error('请先粘贴 AI 分析结果')
      return
    }
    const parsed = parseStyleAnalysis(result)
    await createAnalysis.mutateAsync({
      competitorId: account.id,
      analyzedAt: new Date().toISOString().slice(0, 10),
      ...parsed,
    })
    setResult('')
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>分析 {account.name} 的内容风格</DialogTitle>
          <DialogDescription>
            将提示词发给 AI 助手，再把分段结果粘贴回来；每次保存都会创建新版本。
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='rounded-lg border bg-muted/40 p-4 text-sm leading-6'>
            {prompt}
          </div>
          <Button
            type='button'
            variant='outline'
            onClick={() =>
              void navigator.clipboard
                .writeText(prompt)
                .then(() => toast.success('提示词已复制'))
            }
          >
            <Copy className='size-4' />
            复制提示词
          </Button>
          <Textarea
            rows={10}
            value={result}
            onChange={(event) => setResult(event.target.value)}
            placeholder='粘贴 AI 分析结果'
          />
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            onClick={() => void save()}
            disabled={createAnalysis.isPending}
          >
            {createAnalysis.isPending && (
              <LoaderCircle className='size-4 animate-spin' />
            )}
            解析并保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function StyleAnalysisRecord({
  analysis,
}: {
  analysis: CompetitorStyleAnalysisInput & { id?: string }
}) {
  return (
    <div className='grid gap-3 md:grid-cols-2'>
      {styleAnalysisSections.map(([key, label]) => (
        <section key={key} className='rounded-lg border p-4'>
          <h4 className='text-sm font-medium'>{label}</h4>
          <p className='mt-2 text-sm whitespace-pre-wrap text-muted-foreground'>
            {analysis[key] || '本次未提供'}
          </p>
        </section>
      ))}
    </div>
  )
}
