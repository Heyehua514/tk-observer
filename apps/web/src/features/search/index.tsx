import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import {
  runGlobalSearch,
  buildSearchNextActions,
  type GlobalSearchKind,
  type SearchResult,
} from '@/components/shared/global-search-core'
import { PageHeader } from '@/components/shared/page-header'
import { buildWorkbenchNavigation } from './search-navigation'

const titleByKind: Record<GlobalSearchKind, string> = {
  creator: '达人',
  product: '商品',
  video: '视频',
  company: '客户',
  knowledge: '避坑案例与知识',
  ai_memory: 'AI爆款记忆库',
  account: '对标监控账号',
}

export function SearchResultsPage({
  query,
  kind,
}: {
  query: string
  kind?: string
}) {
  const [selectedKind, setSelectedKind] = useState<string>(kind || 'all')
  const role = useAuthStore((state) => state.user?.role)
  const navigate = useNavigate()
  const results = useQuery({
    queryKey: ['search-results', role, query, selectedKind],
    queryFn: () =>
      runGlobalSearch(query, role || '', {
        limit: 50,
        kind: selectedKind as GlobalSearchKind | 'all',
      }),
    enabled: !!role && !!query.trim(),
  })

  const handleOpenResult = async (item: SearchResult) => {
    const route = buildWorkbenchNavigation(item.kind, query.trim(), item)
    await navigate({
      to: route.to,
      search: route.search,
    })
  }

  const handleJumpToWorkbench = async (targetKind: GlobalSearchKind) => {
    const route = buildWorkbenchNavigation(targetKind, query.trim())
    await navigate({
      to: route.to,
      search: route.search,
    })
  }

  const trimmed = query.trim()
  const groups = results.data || []
  const availableKinds = Array.from(new Set(groups.map((g) => g.kind)))

  return (
    <div className='space-y-6'>
      <PageHeader
        title='搜索结果'
        description={trimmed ? `关键词：“${trimmed}”` : '请输入关键词后搜索'}
      />
      {!trimmed || !results.data ? (
        <EmptyState
          title='输入至少两个字开始搜索'
          description='搜索会跨知识库、对标账号、达人、商品、视频和客户分组返回。'
        />
      ) : (
        <>
          {availableKinds.length > 0 && (
            <div className='flex flex-wrap gap-2 border-b pb-3'>
              <Button
                size='sm'
                variant={selectedKind === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedKind('all')}
              >
                全部类别 ({groups.reduce((acc, g) => acc + g.total, 0)})
              </Button>
              {availableKinds.map((k) => {
                const count = groups.find((g) => g.kind === k)?.total || 0
                return (
                  <Button
                    key={k}
                    size='sm'
                    variant={selectedKind === k ? 'default' : 'outline'}
                    onClick={() => setSelectedKind(k)}
                  >
                    {titleByKind[k as GlobalSearchKind]} ({count})
                  </Button>
                )
              })}
            </div>
          )}

          {buildSearchNextActions(results.data).length > 0 && (
            <section className='space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4'>
              <h2 className='text-sm font-medium'>智能推进建议</h2>
              <ul className='space-y-1 text-sm text-muted-foreground'>
                {buildSearchNextActions(results.data).map((action) => (
                  <li key={action.label}>
                    <span className='font-medium text-foreground'>
                      {action.label}
                    </span>
                    ：{action.reason}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {groups
            .filter(
              (group) => selectedKind === 'all' || group.kind === selectedKind
            )
            .map((group) => (
              <section key={group.kind} className='space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-2'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <span>{titleByKind[group.kind]}</span>
                    <Badge variant='secondary'>{group.total} 条结果</Badge>
                    {group.items.length < group.total && (
                      <span className='text-xs text-muted-foreground'>
                        (当前展示前 {group.items.length} 条)
                      </span>
                    )}
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-7 gap-1 text-xs'
                    onClick={() => void handleJumpToWorkbench(group.kind)}
                  >
                    <span>
                      {buildWorkbenchNavigation(group.kind, trimmed).label}
                    </span>
                    <ExternalLink className='size-3' />
                  </Button>
                </div>
                <div className='divide-y rounded-lg border bg-card'>
                  {group.items.map((item) => (
                    <div
                      key={`${item.kind}-${item.id}`}
                      onClick={() => void handleOpenResult(item)}
                      className='cursor-pointer p-4 transition-colors hover:bg-muted/50'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='font-medium text-foreground'>
                          {item.label}
                        </div>
                        <Badge variant='outline' className='text-xs'>
                          {titleByKind[item.kind]}
                        </Badge>
                      </div>
                      <div className='mt-1 text-sm text-muted-foreground'>
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </>
      )}
    </div>
  )
}
