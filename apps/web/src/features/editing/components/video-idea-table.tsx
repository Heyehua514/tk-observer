/**
 * 爆款选题库 - 表格主组件。
 * 路由：/editing；权限：editing, boss，或具备视频数据导入能力的 business。
 * 后续选题类模块照此模式复制：筛选、分页、批量删除、导入导出和详情抽屉。
 */
import { useMemo, useRef, useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Download,
  ExternalLink,
  Flame,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBeijingTime } from '@/lib/format'
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
import { Input } from '@/components/ui/input'
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
import { LoadStateError } from '@/components/shared/load-state-error'
import { SearchBar } from '@/components/shared/search-bar'
import { videoAccounts, videoTypes } from '../constants'
import { useDeleteVideoIdea } from '../hooks/use-delete-video-idea'
import { useImportVideoIdeas } from '../hooks/use-import-video-ideas'
import {
  fetchVideoIdeasForExport,
  useVideoIdeas,
} from '../hooks/use-video-ideas'
import {
  parseVideoIdeaCsv,
  preflightVideoIdeaCsv,
  exportVideoIdeasCsv,
} from '../hooks/video-idea-csv'
import type { VideoIdea, VideoIdeaListParams } from '../types'
import { editingDataErrorDescription } from './editing-empty-copy'
import { VideoIdeaDetail } from './video-idea-detail'

function downloadCsv(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className='rounded-lg border bg-card p-4'>
      <div className='text-sm text-muted-foreground'>{label}</div>
      <div className='mt-2 text-2xl font-semibold tracking-tight'>{value}</div>
      {detail && (
        <div className='mt-1 text-xs text-muted-foreground'>{detail}</div>
      )}
    </div>
  )
}

export function VideoIdeaTable({
  params,
  onParamsChange,
  metrics,
  onCreate,
  onEdit,
}: {
  params: VideoIdeaListParams
  onParamsChange: (patch: Partial<VideoIdeaListParams>) => void
  metrics: {
    totalVideos: number
    viralCount: number
    monthlyNew: number
    averageCompletionRate: number
  }
  onCreate: () => void
  onEdit: (idea: VideoIdea) => void
}) {
  const ideas = useVideoIdeas(params)
  const deleteIdeas = useDeleteVideoIdea()
  const importIdeas = useImportVideoIdeas()
  const fileInput = useRef<HTMLInputElement>(null)
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [detail, setDetail] = useState<VideoIdea | null>(null)
  const [deleteIds, setDeleteIds] = useState<string[]>([])

  const columns = useMemo<ColumnDef<VideoIdea>[]>(
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
            aria-label={`选择 ${row.original.title}`}
          />
        ),
      },
      {
        accessorKey: 'title',
        header: '标题',
        cell: ({ row }) => (
          <button
            className='max-w-72 truncate text-left font-medium hover:text-primary hover:underline'
            onClick={() => setDetail(row.original)}
          >
            {row.original.title}
          </button>
        ),
      },
      { accessorKey: 'account', header: '账号' },
      { accessorKey: 'videoType', header: '视频类型' },
      {
        accessorKey: 'views',
        header: '播放量',
        cell: ({ row }) => row.original.views.toLocaleString(),
      },
      {
        accessorKey: 'completionRate',
        header: '完播率',
        cell: ({ row }) => `${row.original.completionRate}%`,
      },
      {
        accessorKey: 'followerGain',
        header: '涨粉',
        cell: ({ row }) => row.original.followerGain.toLocaleString(),
      },
      {
        accessorKey: 'likes',
        header: '点赞',
        cell: ({ row }) => row.original.likes.toLocaleString(),
      },
      {
        accessorKey: 'comments',
        header: '评论',
        cell: ({ row }) => row.original.comments.toLocaleString(),
      },
      { accessorKey: 'publishDate', header: '发布日期' },
      {
        accessorKey: 'isViral',
        header: '爆款',
        cell: ({ row }) =>
          row.original.isViral ? (
            <Badge>
              <Flame className='size-3' />
              爆款
            </Badge>
          ) : (
            <Badge variant='secondary'>普通</Badge>
          ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' aria-label='选题操作'>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {row.original.sourceUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={row.original.sourceUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <ExternalLink className='size-4' />
                    打开原视频
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => onEdit(row.original)}>
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
    [onEdit]
  )

  // TanStack Table exposes mutable table APIs; this hook is intentionally not memoized by the React compiler.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: ideas.data?.items || [],
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
  const latestUpdate =
    ideas.data?.items.reduce(
      (latest, idea) => (idea.updated > latest ? idea.updated : latest),
      ''
    ) || ''

  const reset = () =>
    onParamsChange({
      page: 1,
      query: '',
      account: 'all',
      videoType: 'all',
      tag: '',
      dateFrom: '',
      dateTo: '',
      viral: 'all',
      sort: '-views',
    })
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const rows = preflightVideoIdeaCsv(await parseVideoIdeaCsv(file)).rows
      importIdeas.mutate({ fileName: file.name, rows })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CSV 导入失败')
    }
  }
  const handleExport = async () => {
    try {
      const current = await fetchVideoIdeasForExport(params)
      downloadCsv(
        `TK观察选题-${new Date().toISOString().slice(0, 10)}.csv`,
        exportVideoIdeasCsv(current)
      )
      toast.success(`已导出 ${current.length} 条筛选结果`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导出失败')
    }
  }
  const confirmDelete = async () => {
    await deleteIdeas.mutateAsync(deleteIds)
    setDeleteIds([])
    setSelection({})
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          label='总选题数'
          value={metrics.totalVideos.toLocaleString()}
        />
        <MetricCard
          label='爆款数'
          value={metrics.viralCount.toLocaleString()}
        />
        <MetricCard
          label='本月新增'
          value={metrics.monthlyNew.toLocaleString()}
        />
        <MetricCard
          label='平均完播率'
          value={`${metrics.averageCompletionRate.toFixed(1)}%`}
        />
      </div>
      <FilterBar onReset={reset}>
        <SearchBar
          value={params.query}
          onChange={(query) => onParamsChange({ query, page: 1 })}
          placeholder='搜索标题、简述或标签'
        />
        <Select
          value={params.account}
          onValueChange={(account) =>
            onParamsChange({
              account: account as VideoIdeaListParams['account'],
              videoType: 'all',
              page: 1,
            })
          }
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='全部账号' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部账号</SelectItem>
            {videoAccounts.map((account) => (
              <SelectItem key={account} value={account}>
                {account}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.videoType}
          onValueChange={(videoType) =>
            onParamsChange({
              videoType: videoType as VideoIdeaListParams['videoType'],
              page: 1,
            })
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='全部类型' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部类型</SelectItem>
            {videoTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className='w-32'
          value={params.tag}
          onChange={(event) =>
            onParamsChange({ tag: event.target.value, page: 1 })
          }
          placeholder='筛选标签'
        />
        <Input
          className='w-36'
          type='date'
          value={params.dateFrom}
          onChange={(event) =>
            onParamsChange({ dateFrom: event.target.value, page: 1 })
          }
          aria-label='开始日期'
        />
        <Input
          className='w-36'
          type='date'
          value={params.dateTo}
          onChange={(event) =>
            onParamsChange({ dateTo: event.target.value, page: 1 })
          }
          aria-label='结束日期'
        />
        <Select
          value={params.viral}
          onValueChange={(viral) =>
            onParamsChange({
              viral: viral as VideoIdeaListParams['viral'],
              page: 1,
            })
          }
        >
          <SelectTrigger className='w-28'>
            <SelectValue placeholder='爆款筛选' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部</SelectItem>
            <SelectItem value='viral'>仅看爆款</SelectItem>
            <SelectItem value='normal'>普通</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.sort}
          onValueChange={(sort) =>
            onParamsChange({
              sort: sort as VideoIdeaListParams['sort'],
              page: 1,
            })
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='排序' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='-views'>播放量降序</SelectItem>
            <SelectItem value='-completion_rate'>完播率降序</SelectItem>
            <SelectItem value='-follower_gain'>涨粉降序</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Button onClick={onCreate}>
            <Plus className='size-4' />
            新增选题
          </Button>
          <Button
            variant='outline'
            onClick={() => fileInput.current?.click()}
            disabled={importIdeas.isPending}
          >
            <Upload className='size-4' />
            导入 CSV
          </Button>
          <input
            ref={fileInput}
            type='file'
            accept='.csv,text/csv'
            className='hidden'
            onChange={(event) => void handleImport(event)}
          />
          <Button
            variant='outline'
            onClick={() =>
              downloadCsv('TK观察选题模板.csv', exportVideoIdeasCsv([]))
            }
          >
            <Download className='size-4' />
            下载模板
          </Button>
          <Button variant='outline' onClick={() => void handleExport()}>
            <Download className='size-4' />
            导出当前结果
          </Button>
        </div>
        {selectedIds.length > 0 && (
          <Button
            variant='destructive'
            onClick={() => setDeleteIds(selectedIds)}
          >
            <Trash2 className='size-4' />
            批量删除 {selectedIds.length} 条
          </Button>
        )}
      </div>
      {ideas.isError ? (
        <LoadStateError
          title='选题数据加载失败'
          description={editingDataErrorDescription}
          onRetry={() => void ideas.refetch()}
        />
      ) : ideas.data?.items.length === 0 ? (
        <EmptyState
          title='等待视频选题沉淀'
          description='可以手动新增，或下载 CSV 模板批量导入历史视频数据。'
          action={
            <Button onClick={onCreate}>
              <Plus className='size-4' />
              新增选题
            </Button>
          }
        />
      ) : (
        <>
          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  {table.getHeaderGroups()[0]?.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
          <div className='flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground'>
            <span>
              {latestUpdate
                ? `数据更新于 ${formatBeijingTime(latestUpdate)}`
                : '暂无更新时间'}
            </span>
            <div className='flex items-center gap-2'>
              <span>
                第 {ideas.data?.page || 1} / {ideas.data?.totalPages || 1}{' '}
                页，共 {ideas.data?.totalItems || 0} 条
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={!ideas.data?.page || ideas.data.page <= 1}
                onClick={() => onParamsChange({ page: params.page - 1 })}
              >
                上一页
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={
                  !ideas.data || ideas.data.page >= ideas.data.totalPages
                }
                onClick={() => onParamsChange({ page: params.page + 1 })}
              >
                下一页
              </Button>
            </div>
          </div>
        </>
      )}
      <VideoIdeaDetail
        idea={detail}
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
      />
      <AlertDialog
        open={deleteIds.length > 0}
        onOpenChange={(open) => !open && setDeleteIds([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除选题？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，相关导入快照不会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={() => void confirmDelete()}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
