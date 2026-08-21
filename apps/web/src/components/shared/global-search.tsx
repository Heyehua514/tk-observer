/**
 * 顶部栏全局搜索弹窗。
 * @description 250ms 输入即搜，按权限跨工作台分组，每组最多五条。
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { FileVideo, PackageSearch, Store, UserRoundSearch } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
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
import {
  runGlobalSearch,
  type GlobalSearchKind,
  type SearchResult,
} from './global-search-core'

const resultIcons: Record<GlobalSearchKind, typeof FileVideo> = {
  creator: UserRoundSearch,
  product: PackageSearch,
  video: FileVideo,
  company: Store,
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 250)
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

  const openAll = async (kind: GlobalSearchKind) => {
    close()
    await navigate({
      to: '/search',
      search: { q: debouncedQuery, kind },
    })
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
          bizOnly: false,
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
          recordType: result.kind,
          recordId: result.id,
        },
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
              <CommandItem
                value={`viewall-${group.kind}`}
                onSelect={() => void openAll(group.kind)}
              >
                <span className='text-xs text-primary'>
                  查看全部 {group.total} 条
                </span>
              </CommandItem>
            )}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
