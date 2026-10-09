import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { EmptyState } from '@/components/shared/empty-state'
import {
  runGlobalSearch,
  buildSearchNextActions,
  type GlobalSearchKind,
  type SearchResult,
} from '@/components/shared/global-search-core'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    queryKey: ['search-results', role, query],
    queryFn: () => runGlobalSearch(query, role || ''),
    enabled: !!role && !!query.trim(),
  })

  const handleOpenResult = async (item: SearchResult) => {
    if (item.kind === 'creator' || item.kind === 'company') {
      await navigate({
        to: '/business',
        search: {
          page: 1,
          perPage: 20,
          query: '',
          region: 'all',
          status: 'all',
          bizOnly: false,
          sort: '-updated',
          tab: item.kind === 'company' ? 'companies' : 'creators',
          companyPage: 1,
          companyQuery: '',
          companyRegion: 'all',
          companyKind: 'all',
          companySort: '-updated',
          recordType: item.kind,
          recordId: item.id,
        },
      })
    } else if (item.kind === 'product') {
      await navigate({
        to: '/market',
        search: { query: '', recordType: item.kind, recordId: item.id },
      })
    } else if (item.kind === 'knowledge' || item.kind === 'ai_memory') {
      await navigate({
        to: '/overview',
        search: { recordType: item.kind, recordId: item.id },
      })
    } else if (item.kind === 'account') {
      await navigate({
        to: '/editing',
        search: {
          section: 'competitors',
          tab: 'list',
          page: 1,
          perPage: 20,
          query: '',
          account: 'all',
          videoType: 'all',
          tag: '',
          dateFrom: '',
          dateTo: '',
          viral: 'all',
          sort: '-views',
          recordType: 'account',
          recordId: item.id,
        },
      })
    } else {
      await navigate({
        to: '/editing',
        search: {
          section: 'production',
          tab: 'list',
          page: 1,
          perPage: 20,
          query: '',
          account: 'all',
          videoType: 'all',
          tag: '',
          dateFrom: '',
          dateTo: '',
          viral: 'all',
          sort: '-views',
          recordType: item.kind,
          recordId: item.id,
        },
      })
    }
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
            .filter((group) => selectedKind === 'all' || group.kind === selectedKind)
            .map((group) => (
              <section key={group.kind} className='space-y-3'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <span>{titleByKind[group.kind]}</span>
                  <Badge variant='secondary'>{group.total} 条</Badge>
                </div>
                <div className='divide-y rounded-lg border bg-card'>
                  {group.items.map((item) => (
                    <div
                      key={`${item.kind}-${item.id}`}
                      onClick={() => void handleOpenResult(item)}
                      className='cursor-pointer p-4 transition-colors hover:bg-muted/50'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='font-medium text-foreground'>{item.label}</div>
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
