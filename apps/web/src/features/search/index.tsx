import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { EmptyState } from '@/components/shared/empty-state'
import {
  runGlobalSearch,
  type GlobalSearchKind,
} from '@/components/shared/global-search-core'
import { PageHeader } from '@/components/shared/page-header'

const titleByKind: Record<GlobalSearchKind, string> = {
  creator: '达人',
  product: '商品',
  video: '视频',
  company: '客户',
}

export function SearchResultsPage({
  query,
  kind,
}: {
  query: string
  kind?: string
}) {
  const role = useAuthStore((state) => state.user?.role)
  const results = useQuery({
    queryKey: ['search-results', role, query],
    queryFn: () => runGlobalSearch(query, role || ''),
    enabled: !!role && !!query.trim(),
  })

  const trimmed = query.trim()
  return (
    <div className='space-y-6'>
      <PageHeader
        title='搜索结果'
        description={trimmed ? `关键词：${trimmed}` : '请输入关键词后搜索'}
      />
      {!trimmed || !results.data ? (
        <EmptyState
          title='输入至少两个字开始搜索'
          description='搜索会跨达人、商品、视频和客户分组返回。'
        />
      ) : (
        results.data
          .filter((group) => !kind || group.kind === kind)
          .map((group) => (
            <section key={group.kind} className='space-y-3'>
              <div className='text-sm font-medium'>
                {titleByKind[group.kind]} · 共 {group.total} 条
              </div>
              <ul className='divide-y rounded-lg border'>
                {group.items.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className='p-3'>
                    <div className='font-medium'>{item.label}</div>
                    <div className='text-sm text-muted-foreground'>
                      {item.description}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  )
}
