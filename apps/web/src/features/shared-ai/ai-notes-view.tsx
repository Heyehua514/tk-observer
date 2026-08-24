/**
 * AI 记录库：集中查看所有保存的 WorkBuddy AI 结果（搜索/筛选）。
 * 所属工作台：全局（AI 助手）。权限：boss 看全部，成员看自己。
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- ai_notes 未在生成类型内，数据访问走轻量包装 */
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, LoaderCircle, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'

type AiNote = {
  id: string
  scope: string
  taskType: string
  prompt: string
  result: string
  ownerId: string | null
  decision: 'pending' | 'adopted' | 'dismissed'
  decidedAt: string | null
  created: string
}
const aiNoteKeys = ['ai-notes'] as const

function db() {
  return getSupabaseClient() as unknown as {
    from: (table: string) => any
  }
}

export function AiNotesView() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const role = user?.role
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (getDataProvider() !== 'supabase') return
    const channel = getSupabaseClient()
      .channel('ai-notes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_notes' },
        () => void queryClient.invalidateQueries({ queryKey: aiNoteKeys })
      )
      .subscribe()
    return () => void getSupabaseClient().removeChannel(channel)
  }, [queryClient])

  const notes = useQuery({
    queryKey: [...aiNoteKeys, query],
    queryFn: async (): Promise<AiNote[]> => {
      if (getDataProvider() === 'supabase') {
        let builder: any = db().from('ai_notes')
        builder = builder.select(
          'id,scope,task_type,prompt,result,owner_id,decision,decided_at,created_at'
        )
        builder = builder.is('deleted_at', null)
        builder = builder.order('created_at', { ascending: false })
        builder = builder.limit(100)
        if (query.trim()) {
          const q = query.trim().replace(/[%_,]/g, '').slice(0, 80)
          if (q) builder = builder.or(`prompt.ilike.%${q}%,result.ilike.%${q}%`)
        }
        const { data, error } = await builder
        if (error) throw error
        return (data || []).map((r: any) => ({
          id: String(r.id),
          scope: String(r.scope || ''),
          taskType: String(r.task_type || ''),
          prompt: String(r.prompt || ''),
          result: String(r.result || ''),
          ownerId: r.owner_id ? String(r.owner_id) : null,
          decision:
            r.decision === 'adopted' || r.decision === 'dismissed'
              ? r.decision
              : 'pending',
          decidedAt: r.decided_at ? String(r.decided_at) : null,
          created: String(r.created_at || ''),
        }))
      }
      const records = await pb
        .collection('ai_notes')
        .getFullList({ sort: '-created' })
      return records.map((r: any) => ({
        id: String(r.id),
        scope: String(r.scope || ''),
        taskType: String(r.task_type || ''),
        prompt: String(r.prompt || ''),
        result: String(r.result || ''),
        ownerId: String(r.owner || '') || null,
        decision: 'pending',
        decidedAt: null,
        created: String(r.created || ''),
      }))
    },
  })

  const remove = async (id: string) => {
    if (getDataProvider() === 'supabase') {
      const { error } = await db()
        .from('ai_notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return toast.error('删除失败')
    } else {
      await pb.collection('ai_notes').delete(id)
    }
    void queryClient.invalidateQueries({ queryKey: aiNoteKeys })
    toast.success('已删除')
  }

  const decide = async (note: AiNote, decision: 'adopted' | 'dismissed') => {
    if (getDataProvider() !== 'supabase' || note.ownerId !== user?.id) return
    const { error } = await db()
      .from('ai_notes')
      .update({ decision, decided_at: new Date().toISOString() })
      .eq('id', note.id)
    if (error) return toast.error('更新决策失败')
    recordAudit(
      decision === 'adopted' ? '采用 AI 建议' : '忽略 AI 建议',
      'ai_notes',
      note.id
    )
    await queryClient.invalidateQueries({ queryKey: aiNoteKeys })
    toast.success(decision === 'adopted' ? '已标记为采用' : '已标记为忽略')
  }

  return (
    <Card className='bento-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          AI 记录库
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute top-2.5 left-3 size-4 text-muted-foreground' />
            <Input
              className='pl-9'
              placeholder='搜索 AI 记录…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {role === 'boss' && (
            <span className='self-center text-xs text-muted-foreground'>
              全部成员记录可见
            </span>
          )}
        </div>
        {notes.isLoading ? (
          <div className='flex min-h-40 items-center justify-center'>
            <LoaderCircle className='size-5 animate-spin text-muted-foreground' />
          </div>
        ) : notes.data?.length ? (
          <div className='space-y-3'>
            {notes.data.map((note) => (
              <div key={note.id} className='rounded-lg border bg-muted/20 p-3'>
                <div className='mb-1 flex items-center gap-2'>
                  <Badge variant='secondary'>{note.scope}</Badge>
                  <Badge>{note.taskType}</Badge>
                  <Badge
                    variant={
                      note.decision === 'pending' ? 'outline' : 'secondary'
                    }
                  >
                    {note.decision === 'adopted'
                      ? '已采用'
                      : note.decision === 'dismissed'
                        ? '已忽略'
                        : '待决策'}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {new Date(note.created).toLocaleString('zh-CN')}
                  </span>
                  {getDataProvider() === 'supabase' &&
                    note.decision === 'pending' &&
                    note.ownerId === user?.id && (
                      <>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => void decide(note, 'adopted')}
                        >
                          <Check className='size-3' />
                          采用
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => void decide(note, 'dismissed')}
                        >
                          <X className='size-3' />
                          忽略
                        </Button>
                      </>
                    )}
                  <Button
                    size='sm'
                    variant='ghost'
                    className='ml-auto text-destructive'
                    onClick={() => void remove(note.id)}
                  >
                    <Trash2 className='size-3' />
                  </Button>
                </div>
                <p className='text-sm font-medium'>{note.prompt}</p>
                <pre className='mt-2 max-h-40 overflow-auto rounded border bg-background/60 p-2 text-xs whitespace-pre-wrap'>
                  {note.result}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title='还没有保存的 AI 记录'
            description='在工作台使用 AI 助手并点击「保存到记录」后会显示在这里。'
          />
        )}
      </CardContent>
    </Card>
  )
}
