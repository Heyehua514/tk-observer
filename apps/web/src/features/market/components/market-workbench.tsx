/** 市场工作台主体：选品库、竞品、投放数据和活动排期骨架。 */
import { useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Coins,
  FileStack,
  Layers,
  MapPinned,
  PackageSearch,
  Percent,
  Radar,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '@/lib/format'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchBar } from '@/components/shared/search-bar'
import { AiAssistantPanel } from '@/features/shared-ai'
import { buildAdOverview } from '../ads/ad-overview'
import { CompetitorsWorkbench, MarketCompetitorSummary } from '../competitors'
import { useMarketWorkbench } from '../hooks/use-market-workbench'
import { useProductCatalog } from '../hooks/use-product-catalog'
import { useDeleteProduct } from '../hooks/use-product-crud'
import { MarketResourcesWorkbench } from '../resources'
import { VenuesWorkbench } from '../venues'
import { marketEmptyTitles } from './market-empty-copy'
import { EventsPanel } from './market-records'
import { ProductFormDialog, type ProductFormData } from './product-form'
import { formatCurrency } from './product-model'

const statusLabels: Record<string, string> = {
  draft: '草稿',
  testing: '测试中',
  active: '在售',
  paused: '已暂停',
}

export function MarketWorkbench({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (query: string) => void
}) {
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(
    null
  )
  const [deleteTarget, setDeleteTarget] = useState<ProductFormData | null>(null)
  const removeProduct = useDeleteProduct()
  const activeQuery = useMarketWorkbench(query)
  const products = useProductCatalog(activeQuery)
  const adOverview = buildAdOverview()

  // 选品大盘关键指标统计
  const productList = products.data || []
  const totalProductsCount = productList.length
  const avgMarginRate =
    totalProductsCount > 0
      ? (
          productList.reduce((acc, p) => acc + p.marginRate, 0) /
          totalProductsCount
        ).toFixed(1)
      : '0.0'
  const totalPotentialProfitCny = productList.reduce(
    (acc, p) => acc + p.profitInCnyMinor,
    0
  )
  const activeTestingCount = productList.filter(
    (p) => p.status === 'active' || p.status === 'testing'
  ).length

  const productsContext = productList.length
    ? `当前选品库前几项：\n${productList
        .slice(0, 5)
        .map(
          (p) =>
            `- ${p.name}（${p.category}/${p.region}，售价 ${formatCurrency(p.priceMinor, p.currency)}，毛利率 ${p.marginRate}%）`
        )
        .join('\n')}`
    : '当前选品库暂无数据。'

  return (
    <div className='space-y-6'>
      <PageHeader
        title='市场工作台'
        description='管理选品、竞品情报、站点投放和活动节奏。'
      />
      <div className='grid gap-3 md:grid-cols-6'>
        <div className='bento-card p-4 md:col-span-2'>
          <MarketCompetitorSummary />
        </div>
        <div className='bento-card p-4 md:col-span-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-xs text-muted-foreground'>投放数据</div>
              <div className='mt-1 text-lg font-semibold'>站点投放概览</div>
            </div>
            <TrendingUp className='size-4 text-emerald-500' />
          </div>
          <div className='mt-4 grid gap-3 sm:grid-cols-3'>
            {adOverview.summary.map((item) => (
              <div
                key={item.label}
                className='rounded-lg border bg-card/60 p-3'
              >
                <div className='text-xs text-muted-foreground'>
                  {item.label}
                </div>
                <div className='mt-1 text-xl font-semibold'>{item.value}</div>
                <div className='text-xs text-emerald-600'>{item.delta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Tabs defaultValue='products'>
        <TabsList>
          <TabsTrigger value='products'>
            <PackageSearch className='size-4' />
            选品库
          </TabsTrigger>
          <TabsTrigger value='competitors'>
            <Radar className='size-4' />
            竞品监测
          </TabsTrigger>
          <TabsTrigger value='ads'>
            <BarChart3 className='size-4' />
            投放数据
          </TabsTrigger>
          <TabsTrigger value='calendar'>
            <CalendarDays className='size-4' />
            活动排期
          </TabsTrigger>
          <TabsTrigger value='venues'>
            <MapPinned className='size-4' />
            场地资源
          </TabsTrigger>
          <TabsTrigger value='resources'>
            <FileStack className='size-4' />
            模板 / 物料 / 财务
          </TabsTrigger>
        </TabsList>
        <TabsContent value='products' className='mt-5 space-y-4'>
          {/* 选品库经营与毛利指标卡 */}
          <div className='grid gap-3 sm:grid-cols-4'>
            <div className='rounded-lg border bg-card/60 p-3.5'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>选品池总数</span>
                <Layers className='size-3.5 text-muted-foreground' />
              </div>
              <div className='mt-1.5 text-2xl font-bold'>{totalProductsCount}</div>
              <div className='text-xs text-muted-foreground'>SKU 储备规模</div>
            </div>
            <div className='rounded-lg border bg-card/60 p-3.5'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>在售 / 测款品</span>
                <TrendingUp className='size-3.5 text-emerald-500' />
              </div>
              <div className='mt-1.5 text-2xl font-bold text-emerald-600'>{activeTestingCount}</div>
              <div className='text-xs text-muted-foreground'>当前处于测试及销售周期</div>
            </div>
            <div className='rounded-lg border bg-card/60 p-3.5'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>平均预期毛利率</span>
                <Percent className='size-3.5 text-blue-500' />
              </div>
              <div className='mt-1.5 text-2xl font-bold text-blue-600'>{avgMarginRate}%</div>
              <div className='text-xs text-muted-foreground'>跨币种汇率换算后综合口径</div>
            </div>
            <div className='rounded-lg border bg-card/60 p-3.5'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>潜在毛利折合</span>
                <Coins className='size-3.5 text-amber-500' />
              </div>
              <div className='mt-1.5 text-2xl font-bold text-amber-600'>
                {formatMoney(totalPotentialProfitCny, 'CNY')}
              </div>
              <div className='text-xs text-muted-foreground'>按单件全量销售折合</div>
            </div>
          </div>

          <div className='flex items-center justify-between gap-3'>
            <SearchBar
              value={query}
              onChange={onQueryChange}
              placeholder='搜索商品名称、类目或站点'
            />
            <div className='flex items-center gap-2'>
              {activeQuery && (
                <span className='text-sm text-muted-foreground'>
                  搜索：{activeQuery}
                </span>
              )}
              <Button
                onClick={() => {
                  setEditingProduct(null)
                  setProductFormOpen(true)
                }}
              >
                新增商品
              </Button>
            </div>
          </div>
          {productList.length ? (
            <div className='overflow-hidden rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名称</TableHead>
                    <TableHead>类目</TableHead>
                    <TableHead>销售定价</TableHead>
                    <TableHead>采购成本</TableHead>
                    <TableHead>换算汇率</TableHead>
                    <TableHead>预估单件毛利</TableHead>
                    <TableHead>目标站点</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className='text-right'>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productList.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <CircleDollarSign className='size-4 text-primary shrink-0' />
                          <span className='truncate max-w-[160px]'>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>
                            {formatCurrency(product.priceMinor, product.currency)}
                          </span>
                          {product.currency !== 'CNY' && (
                            <span className='text-[11px] text-muted-foreground'>
                              ≈ ¥{(product.priceInCnyMinor / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>
                            {formatCurrency(product.costMinor, product.costCurrency || 'CNY')}
                          </span>
                          {(product.costCurrency || 'CNY') !== 'CNY' && (
                            <span className='text-[11px] text-muted-foreground'>
                              ≈ ¥{(product.costInCnyMinor / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-xs text-muted-foreground font-mono'>
                          {product.currency !== 'CNY'
                            ? `1 ${product.currency} = ${product.exchangeRate}`
                            : '基准 1.0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          <span
                            className={`font-semibold text-sm ${
                              product.profitInCnyMinor < 0
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {product.profitInCnyMinor >= 0 ? '+' : ''}
                            ¥{(product.profitInCnyMinor / 100).toFixed(2)}
                          </span>
                          <div>
                            <Badge
                              variant={
                                product.marginLevel === 'loss'
                                  ? 'destructive'
                                  : product.marginLevel === 'low'
                                  ? 'secondary'
                                  : 'default'
                              }
                              className='text-[10px] px-1.5 py-0'
                            >
                              {product.marginLevel === 'high' && (
                                <TrendingUp className='mr-0.5 size-2.5 inline' />
                              )}
                              {product.marginLevel === 'loss' && (
                                <AlertTriangle className='mr-0.5 size-2.5 inline' />
                              )}
                              {product.marginRate}%
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className='font-mono'>
                          {product.region}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === 'active'
                              ? 'default'
                              : product.status === 'testing'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {statusLabels[product.status] || product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => {
                              setEditingProduct(product)
                              setProductFormOpen(true)
                            }}
                          >
                            编辑
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='text-destructive hover:text-destructive'
                            onClick={() => setDeleteTarget(product)}
                          >
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title={
                activeQuery ? '没有匹配的商品' : marketEmptyTitles.products
              }
              description={
                activeQuery
                  ? '换个关键词试试，确认商品名称、类目或站点拼写。'
                  : '商品将包含名称、类目、售价、采购成本、汇率与毛利率闭环。'
              }
              action={
                <Button size='sm' onClick={() => setProductFormOpen(true)}>
                  新建商品
                </Button>
              }
            />
          )}
          <ProductFormDialog
            open={productFormOpen}
            onOpenChange={setProductFormOpen}
            product={editingProduct}
          />
          <AlertDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null)
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除商品？</AlertDialogTitle>
                <AlertDialogDescription>
                  删除后商品会从选品库隐藏，确认继续吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  className='bg-destructive text-white hover:bg-destructive/90'
                  disabled={removeProduct.isPending}
                  onClick={() => {
                    if (!deleteTarget) return
                    removeProduct.mutate(deleteTarget.id)
                    setDeleteTarget(null)
                  }}
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
        <TabsContent value='competitors' className='mt-5'>
          <CompetitorsWorkbench query={activeQuery} />
        </TabsContent>
        <TabsContent value='ads' className='mt-5'>
          <div className='space-y-4'>
            <div className='glass-card h-72 p-5'>
              <h3 className='mb-4 text-sm font-medium'>按站点投放数据</h3>
              <ResponsiveContainer width='100%' height='85%'>
                <BarChart data={adOverview.regions}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey='region' />
                  <YAxis />
                  <Bar
                    dataKey='value'
                    fill='var(--chart-1)'
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
        <TabsContent value='calendar' className='mt-5'>
          <EventsPanel query={query} />
        </TabsContent>
        <TabsContent value='venues' className='mt-5'>
          <VenuesWorkbench />
        </TabsContent>
        <TabsContent value='resources' className='mt-5'>
          <MarketResourcesWorkbench />
        </TabsContent>
      </Tabs>
      <AiAssistantPanel
        scope='market'
        context={productsContext}
        initialPrompt='分析当前选品库的平均毛利率与跨币种成本结构，并给出最优爆款测试策略。'
      />
    </div>
  )
}
