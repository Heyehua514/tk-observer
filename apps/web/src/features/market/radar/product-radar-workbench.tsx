/**
 * 爆品雷达工作台主面板：
 * - 聚合大盘热度统计与多维综合筛选（地区、类目、平台、热度阈值、标签、排序）
 * - 支持 CSV / JSON 一键结构化导出
 * - 支持一键将雷达爆品录入选品库流转
 */
import { useState, useMemo } from 'react'
import {
  Download,
  ExternalLink,
  Flame,
  Plus,
  Search,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  exportRadarItemsToCsv,
  exportRadarItemsToJson,
  getRadarHeatGrade,
  RADAR_CATEGORIES,
  SOURCE_PLATFORM_LABELS,
} from './radar-model'
import type {
  ProductRadarFilterParams,
  ProductRadarSortField,
} from './types'
import {
  useAddRadarToProductCatalog,
  useProductRadarList,
} from './use-product-radar'

const regions = ['all', 'US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG'] as const

export function ProductRadarWorkbench() {
  const [params, setParams] = useState<ProductRadarFilterParams>({
    query: '',
    region: 'all',
    category: 'all',
    sourcePlatform: 'all',
    minHeatScore: 0,
    sortField: 'heatScore',
    sortDirection: 'desc',
  })

  const radarQuery = useProductRadarList(params)
  const addToCatalog = useAddRadarToProductCatalog()
  const items = radarQuery.data || []

  // 顶部关键指标
  const summary = useMemo(() => {
    const totalCount = items.length
    const explosiveCount = items.filter((i) => i.heatScore >= 85).length
    const avgGrowthRate =
      totalCount > 0
        ? (items.reduce((sum, i) => sum + i.growthRate, 0) / totalCount).toFixed(1)
        : '0.0'
    const addedCount = items.filter((i) => i.isAddedToProducts).length
    return { totalCount, explosiveCount, avgGrowthRate, addedCount }
  }, [items])

  // 导出处理函数
  const handleExportCsv = () => {
    const csvContent = exportRadarItemsToCsv(items)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `tk-product-radar-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportJson = () => {
    const jsonContent = exportRadarItemsToJson(items)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `tk-product-radar-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='space-y-4'>
      {/* 顶部热度指标看板 */}
      <div className='grid gap-3 sm:grid-cols-4'>
        <div className='rounded-lg border bg-card/60 p-3.5'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>监测爆品数</span>
            <Flame className='size-3.5 text-muted-foreground' />
          </div>
          <div className='mt-1.5 text-2xl font-bold'>{summary.totalCount}</div>
          <div className='text-xs text-muted-foreground'>全网雷达捕获品</div>
        </div>
        <div className='rounded-lg border bg-card/60 p-3.5'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>超级爆款 (热度≥85)</span>
            <Flame className='size-3.5 text-rose-500' />
          </div>
          <div className='mt-1.5 text-2xl font-bold text-rose-600'>{summary.explosiveCount}</div>
          <div className='text-xs text-muted-foreground'>具备极高投产潜力</div>
        </div>
        <div className='rounded-lg border bg-card/60 p-3.5'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>7日平均增长率</span>
            <TrendingUp className='size-3.5 text-emerald-500' />
          </div>
          <div className='mt-1.5 text-2xl font-bold text-emerald-600'>+{summary.avgGrowthRate}%</div>
          <div className='text-xs text-muted-foreground'>出海热度爬升动能</div>
        </div>
        <div className='rounded-lg border bg-card/60 p-3.5'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>已流转至选品库</span>
            <PackageCheck className='size-3.5 text-blue-500' />
          </div>
          <div className='mt-1.5 text-2xl font-bold text-blue-600'>{summary.addedCount}</div>
          <div className='text-xs text-muted-foreground'>进入测款与备货流程</div>
        </div>
      </div>

      {/* 筛选与操作工具栏 */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative w-56'>
            <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
            <Input
              value={params.query || ''}
              onChange={(e) => setParams((p) => ({ ...p, query: e.target.value }))}
              placeholder='搜索爆品名、标签或备注...'
              className='pl-8 text-xs'
            />
          </div>

          <Select
            value={params.region || 'all'}
            onValueChange={(val) =>
              setParams((p) => ({ ...p, region: val as ProductRadarFilterParams['region'] }))
            }
          >
            <SelectTrigger className='w-28 text-xs'>
              <SelectValue placeholder='站点' />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r} className='text-xs'>
                  {r === 'all' ? '全部站点' : r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={params.category || 'all'}
            onValueChange={(val) => setParams((p) => ({ ...p, category: val }))}
          >
            <SelectTrigger className='w-32 text-xs'>
              <SelectValue placeholder='类目' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='text-xs'>
                全部品类
              </SelectItem>
              {RADAR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className='text-xs'>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={params.sortField || 'heatScore'}
            onValueChange={(val) =>
              setParams((p) => ({ ...p, sortField: val as ProductRadarSortField }))
            }
          >
            <SelectTrigger className='w-32 text-xs'>
              <SelectValue placeholder='排序' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='heatScore' className='text-xs'>
                按热度评分
              </SelectItem>
              <SelectItem value='salesVolume' className='text-xs'>
                按销售量
              </SelectItem>
              <SelectItem value='growthRate' className='text-xs'>
                按7日增长率
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-2'>
          <Button size='sm' variant='outline' onClick={handleExportCsv} className='text-xs'>
            <Download className='mr-1 size-3.5' />
            导出 CSV
          </Button>
          <Button size='sm' variant='outline' onClick={handleExportJson} className='text-xs'>
            <Download className='mr-1 size-3.5' />
            导出 JSON
          </Button>
        </div>
      </div>

      {/* 爆品雷达数据表格 */}
      {items.length === 0 ? (
        <EmptyState
          title='暂无符合条件的爆品数据'
          description='尝试调整筛选关键词、站点或类目条件重新捕获。'
        />
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>爆品标题与来源</TableHead>
                <TableHead>类目 / 站点</TableHead>
                <TableHead>热度评级</TableHead>
                <TableHead>销量与销售额</TableHead>
                <TableHead>7日增长率</TableHead>
                <TableHead>标签画像</TableHead>
                <TableHead className='text-right'>操作流转</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const grade = getRadarHeatGrade(item.heatScore)
                return (
                  <TableRow key={item.id}>
                    <TableCell className='max-w-[280px]'>
                      <div className='font-medium line-clamp-1' title={item.title}>
                        {item.title}
                      </div>
                      <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
                        <span>{SOURCE_PLATFORM_LABELS[item.sourcePlatform] || item.sourcePlatform}</span>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center hover:text-primary'
                          >
                            <ExternalLink className='size-3' />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{item.category}</Badge>
                      <span className='ml-1.5 text-xs text-muted-foreground font-mono'>
                        {item.region}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1.5'>
                        <Flame className={`size-4 ${grade.color}`} />
                        <span className='font-mono font-bold'>{item.heatScore}</span>
                        <span className={`text-xs ${grade.color}`}>({grade.label})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='font-mono font-medium'>
                        {item.salesVolume.toLocaleString()} 件
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {item.currency} {(item.salesAmountMinor / 100).toLocaleString('zh-CN', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='font-mono font-semibold text-emerald-600'>
                        +{item.growthRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className='rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.isAddedToProducts ? (
                        <div className='inline-flex items-center gap-1 text-xs text-emerald-600 font-medium'>
                          <CheckCircle2 className='size-3.5' />
                          已入选品库
                        </div>
                      ) : (
                        <Button
                          size='sm'
                          variant='secondary'
                          disabled={addToCatalog.isPending}
                          onClick={() => addToCatalog.mutate(item)}
                          className='text-xs'
                        >
                          <Plus className='mr-1 size-3' />
                          加入选品
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
