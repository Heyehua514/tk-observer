/** 个人 AI 记忆查看与删除；只显示当前账号 RLS 可见的内容。 */
import { LoaderCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { useAiMemory } from '@/features/shared-ai/hooks/use-ai-memory'

export function AiMemoryView() {
  const memories = useAiMemory()
  const remove = async (id: string) => {
    try {
      await memories.remove(id)
      toast.success('记忆已删除')
    } catch {
      toast.error('记忆删除失败')
    }
  }

  return (
    <Card className='bento-card'>
      <CardHeader>
        <CardTitle className='text-base'>个人 AI 记忆</CardTitle>
      </CardHeader>
      <CardContent>
        {memories.isLoading ? (
          <LoaderCircle className='size-5 animate-spin text-muted-foreground' />
        ) : memories.data.length ? (
          <div className='space-y-2'>
            {memories.data.map((memory) => (
              <div
                key={memory.id}
                className='flex items-start gap-3 rounded-lg border p-3'
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-xs text-muted-foreground'>
                    {memory.memoryKey}
                  </p>
                  <p className='mt-1 text-sm'>{memory.memoryValue}</p>
                </div>
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label='删除记忆'
                  className='text-destructive'
                  onClick={() => void remove(memory.id)}
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title='还没有个人记忆'
            description='在 AI 结果中点击「记住这条」后，会显示在这里。'
          />
        )}
      </CardContent>
    </Card>
  )
}
