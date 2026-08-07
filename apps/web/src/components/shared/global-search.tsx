/**
 * 顶部栏全局搜索弹窗。
 * @description 300ms 输入即搜，按权限跨工作台分组，每组最多五条。
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { FileVideo, PackageSearch, Store, UserRoundSearch } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { pb } from '@/lib/pocketbase'
import { useSearch } from '@/context/search-provider'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export type GlobalSearchKind = 'creator' | 'product' | 'video' | 'company'

type SearchResult = {
  id: string
  kind: GlobalSearchKind
  label: string
  description: string
}

type SearchGroup = {
  kind: GlobalSearchKind
  title: string
  total: number
  items: SearchResult[]
}

async function runGlobalSearch(
  query: string,
  role: string
): Promise<SearchGroup[]> {
  const tasks: Promise<SearchGroup>[] = []
  if (role === 'boss' || role === 'business') {
    tasks.push(
      pb
        .collection('creators')
        .getList(1, 5, {
          filter: pb.filter(
            'nickname ~ {:q} || tiktok_url ~ {:q} || region ~ {:q}',
            { q: query }
          ),
        })
        .then((page) => ({
          kind: 'creator' as const,
          title: '达人',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'creator' as const,
            label: String(item.nickname),
            description: `${String(item.region)} · ${Number(item.followers).toLocaleString()} 粉丝`,
          })),
        })),
      pb
        .collection('companies')
        .getList(1, 5, {
          filter: pb.filter('company_name ~ {:q} || contact_name ~ {:q}', {
            q: query,
          }),
        })
        .then((page) => ({
          kind: 'company' as const,
          title: '客户 / 供应商',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'company' as const,
            label: String(item.company_name),
            description: String(item.contact_name || '暂无联系人'),
          })),
        }))
    )
  }
  if (role === 'boss' || role === 'market') {
    tasks.push(
      pb
        .collection('products')
        .getList(1, 5, {
          filter: pb.filter('name ~ {:q} || category ~ {:q} || region ~ {:q}', {
            q: query,
          }),
        })
        .then((page) => ({
          kind: 'product' as const,
          title: '商品',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'product' as const,
            label: String(item.name),
            description: `${String(item.category)} · ${String(item.region)}`,
          })),
        }))
    )
  }
  if (role === 'boss' || role === 'editing') {
    tasks.push(
      pb
        .collection('videos')
        .getList(1, 5, {
          filter: pb.filter(
            'title ~ {:q} || creator_name ~ {:q} || product_name ~ {:q} || creator.nickname ~ {:q}',
            { q: query }
          ),
        })
        .then((page) => ({
          kind: 'video' as const,
          title: '视频',
          total: page.totalItems,
          items: page.items.map((item) => ({
            id: item.id,
            kind: 'video' as const,
            label: String(item.title),
            description: `${String(item.creator_name || '未关联达人')} · ${String(item.product_name || '未关联商品')}`,
          })),
        }))
    )
  }
  return (await Promise.all(tasks)).filter((group) => group.total > 0)
}

const resultIcons = {
  creator: UserRoundSearch,
  product: PackageSearch,
  video: FileVideo,
  company: Store,
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { open, setOpen } = useSearch()
  const role = useAuthStore((state) => state.user?.role)
  const navigate = useNavigate()
  const groups = useQuery({
    queryKey: ['global-search', role, debouncedQuery],
    queryFn: () => runGlobalSearch(debouncedQuery, role || ''),
    enabled: open && !!role && debouncedQuery.trim().length >= 2,
  })

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const openResult = async (result: SearchResult) => {
    close()
    if (result.kind === 'creator' || result.kind === 'company') {
      await navigate({
        to: '/business',
        search: {
          page: 1,
          perPage: 20,
          query: '',
          region: 'all',
          status: 'all',
          sort: '-updated',
          tab: result.kind === 'company' ? 'companies' : 'creators',
          companyPage: 1,
          companyQuery: '',
          companyRegion: 'all',
          companyKind: 'all',
          companySort: '-updated',
          recordType: result.kind,
          recordId: result.id,
        },
      })
    } else if (result.kind === 'product') {
      await navigate({
        to: '/market',
        search: { query: '', recordType: result.kind, recordId: result.id },
      })
    } else {
      await navigate({
        to: '/editing',
        search: { query: '', recordType: result.kind, recordId: result.id },
      })
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder='搜索达人、商品、视频、客户…'
      />
      <CommandList>
        {debouncedQuery.length < 2 ? (
          <div className='px-4 py-10 text-center text-sm text-muted-foreground'>
            输入至少两个字开始搜索
          </div>
        ) : (
          <CommandEmpty>
            {groups.isFetching ? '正在搜索…' : '未找到相关内容'}
          </CommandEmpty>
        )}
        {groups.data?.map((group) => (
          <CommandGroup key={group.kind} heading={group.title}>
            {group.items.map((result) => {
              const Icon = resultIcons[result.kind]
              return (
                <CommandItem
                  key={`${result.kind}-${result.id}`}
                  value={`${result.label}-${result.id}`}
                  onSelect={() => void openResult(result)}
                >
                  <Icon className='size-4' />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate'>{result.label}</div>
                    <div className='truncate text-xs text-muted-foreground'>
                      {result.description}
                    </div>
                  </div>
                </CommandItem>
              )
            })}
            {group.total > 5 && (
              <div className='px-2 py-1 text-xs text-muted-foreground'>
                查看全部 {group.total} 条
              </div>
            )}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
