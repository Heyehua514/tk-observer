/**
 * 达人管理 - 列表页主组件
 * 路由：/business
 * 依赖：use-creators hook、TanStack Table
 * 后续任何标准 CRUD 模块照此组件结构复制。
 */
import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import { useSearch } from '@/hooks/use-search'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterBar } from '@/components/shared/filter-bar'
import { SearchBar } from '@/components/shared/search-bar'
import {
  cooperationStatuses,
  cooperationStatusLabels,
  regions,
} from '../constants'
import { useBulkUpdateCreators } from '../hooks/use-bulk-update-creators'
import { useCreators } from '../hooks/use-creators'
import { useDeleteCreator } from '../hooks/use-delete-creator'
import type { CooperationStatus, Creator, CreatorListParams } from '../types'
import { CreatorDetail } from './creator-detail'
import { CreatorFormDialog } from './creator-form'

export function CreatorTable({
  params,
  onParamsChange,
}: {
  params: CreatorListParams
  onParamsChange: (patch: Partial<CreatorListParams>) => void
}) {
  const queryParams = useSearch(params)
  const creators = useCreators(queryParams)
  const deleteCreator = useDeleteCreator()
  const bulkUpdate = useBulkUpdateCreators()
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [detail, setDetail] = useState<Creator | null>(null)
  const [editing, setEditing] = useState<Creator | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteIds, setDeleteIds] = useState<string[]>([])

  const columns = useMemo<ColumnDef<Creator>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label='选择当前页'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`选择 ${row.original.nickname}`}
          />
        ),
      },
      {
        accessorKey: 'nickname',
        header: '达人',
        cell: ({ row }) => (
          <button
            className='text-left font-medium hover:text-primary hover:underline'
            onClick={() => setDetail(row.original)}
          >
            {row.original.nickname}
          </button>
        ),
      },
      {
        accessorKey: 'tiktokUrl',
        header: 'TikTok 主页',
        cell: ({ row }) => (
          <a
            className='inline-flex max-w-48 items-center gap-1 truncate text-muted-foreground hover:text-foreground'
            href={row.original.tiktokUrl}
            target='_blank'
            rel='noreferrer'
          >
            <span className='truncate'>
              {row.original.tiktokUrl.replace('https://www.tiktok.com/', '')}
            </span>
            <ExternalLink className='size-3 shrink-0' />
          </a>
        ),
      },
      {
        accessorKey: 'followers',
        header: '粉丝量',
        cell: ({ row }) => row.original.followers.toLocaleString(),
      },
      { accessorKey: 'region', header: '地区' },
      {
        accessorKey: 'cooperationStatus',
        header: '合作状态',
        cell: ({ row }) => (
          <Badge variant='secondary'>
            {cooperationStatusLabels[row.original.cooperationStatus]}
          </Badge>
        ),
      },
      {
        accessorKey: 'commissionRate',
        header: '佣金',
        cell: ({ row }) => `${row.original.commissionRate}%`,
      },
      { accessorKey: 'owner', header: '对接人' },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' aria-label='达人操作'>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onSelect={() => {
                  setEditing(row.original)
                  setFormOpen(true)
                }}
              >
                <Pencil className='size-4' />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onSelect={() => setDeleteIds([row.original.id])}
              >
                <Trash2 className='size-4' />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  // TanStack Table returns mutable table APIs by design; React Compiler must not memoize this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: creators.data?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
    enableRowSelection: true,
  })
  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id)
  const latestUpdate = creators.data?.items.reduce(
    (latest, item) => (item.updated > latest ? item.updated : latest),
    ''
  )

  const resetFilters = () =>
    onParamsChange({
      query: '',
      region: 'all',
      status: 'all',
      sort: '-updated',
      page: 1,
    })
  const confirmDelete = async () => {
    await deleteCreator.mutateAsync(deleteIds)
    setDeleteIds([])
    setSelection({})
  }

  return (
    <div className='space-y-4'>
      <FilterBar onReset={resetFilters}>
        <SearchBar
          value={params.query}
          onChange={(query) => onParamsChange({ query, page: 1 })}
          placeholder='搜索昵称、主页或对接人'
        />
        <Select
          value={params.region}
          onValueChange={(region) =>
            onParamsChange({
              region: region as CreatorListParams['region'],
              page: 1,
            })
          }
        >
          <SelectTrigger className='w-28'>
            <SelectValue placeholder='站点' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部站点</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.status}
          onValueChange={(status) =>
            onParamsChange({
              status: status as CreatorListParams['status'],
              page: 1,
            })
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='状态' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部状态</SelectItem>
            {cooperationStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {cooperationStatusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.sort}
          onValueChange={(sort) =>
            onParamsChange({ sort: sort as CreatorListParams['sort'], page: 1 })
          }
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='排序' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='-updated'>最近更新</SelectItem>
            <SelectItem value='-created'>最近创建</SelectItem>
            <SelectItem value='nickname'>昵称 A-Z</SelectItem>
            <SelectItem value='-nickname'>昵称 Z-A</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <div className='flex min-h-9 flex-wrap items-center gap-2'>
        {selectedIds.length > 0 && (
          <>
            <span className='text-sm text-muted-foreground'>
              已选 {selectedIds.length} 项
            </span>
            <Select
              onValueChange={(status) =>
                bulkUpdate.mutate({
                  ids: selectedIds,
                  status: status as CooperationStatus,
                })
              }
            >
              <SelectTrigger className='h-8 w-32'>
                <SelectValue placeholder='批量改状态' />
              </SelectTrigger>
              <SelectContent>
                {cooperationStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {cooperationStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setDeleteIds(selectedIds)}
            >
              <Trash2 className='size-4' />
              批量删除
            </Button>
          </>
        )}
        <Button
          className='ml-auto'
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className='size-4' />
          新增达人
        </Button>
      </div>

      {creators.isLoading ? (
        <div className='flex min-h-64 items-center justify-center text-sm text-muted-foreground'>
          正在加载达人数据…
        </div>
      ) : creators.data?.items.length === 0 ? (
        <EmptyState
          title='还没有达人资料'
          description='新增第一位达人，后续合作状态和团队更新会实时同步。'
          action={
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className='size-4' />
              新增达人
            </Button>
          }
        />
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className='flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center'>
        <span>
          {latestUpdate
            ? `数据更新于 ${formatBeijingTime(latestUpdate)}`
            : '等待首条数据'}
        </span>
        <div className='ml-auto flex items-center gap-2'>
          <span>
            第 {creators.data?.page || params.page} /{' '}
            {Math.max(creators.data?.totalPages || 1, 1)} 页，共{' '}
            {creators.data?.totalItems || 0} 条
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={params.page <= 1}
            onClick={() => onParamsChange({ page: params.page - 1 })}
          >
            上一页
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={params.page >= (creators.data?.totalPages || 1)}
            onClick={() => onParamsChange({ page: params.page + 1 })}
          >
            下一页
          </Button>
        </div>
      </div>

      <CreatorDetail
        creator={detail}
        onClose={() => setDetail(null)}
        onEdit={(creator) => {
          setDetail(null)
          setEditing(creator)
          setFormOpen(true)
        }}
      />
      <CreatorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        creator={editing}
      />
      <AlertDialog
        open={deleteIds.length > 0}
        onOpenChange={(open) => !open && setDeleteIds([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除达人？</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除所选 {deleteIds.length}{' '}
              条达人资料，关联合作记录也可能被一并删除。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteCreator.isPending}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
