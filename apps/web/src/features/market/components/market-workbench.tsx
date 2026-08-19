/** 市场工作台主体：选品库、竞品、投放数据和活动排期骨架。 */
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  FileStack,
  MapPinned,
  PackageSearch,
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
import { Badge } from '@/components/ui/badge'
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
import { buildAdOverview } from '../ads/ad-overview'
import { CompetitorsWorkbench, MarketCompetitorSummary } from '../competitors'
import { useMarketWorkbench } from '../hooks/use-market-workbench'
import { useProductCatalog } from '../hooks/use-product-catalog'
import { MarketResourcesWorkbench } from '../resources'
import { VenuesWorkbench } from '../venues'
import { marketEmptyTitles } from './market-empty-copy'
import { EventsPanel } from './market-records'

export function MarketWorkbench({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (query: string) => void
}) {
  const activeQuery = useMarketWorkbench(query)
  const products = useProductCatalog(activeQuery)
  const adOverview = buildAdOverview()
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
        <TabsContent value='products' className='mt-5'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <SearchBar
              value={query}
              onChange={onQueryChange}
              placeholder='搜索商品名称、类目或站点'
            />
            {activeQuery && (
              <span className='text-sm text-muted-foreground'>
                搜索：{activeQuery}
              </span>
            )}
          </div>
          {products.data?.length ? (
            <div className='overflow-hidden rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品</TableHead>
                    <TableHead>类目</TableHead>
                    <TableHead>售价</TableHead>
                    <TableHead>成本</TableHead>
                    <TableHead>毛利</TableHead>
                    <TableHead>站点</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.data.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <CircleDollarSign className='size-4 text-primary' />
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.priceMinor}</TableCell>
                      <TableCell>{product.costMinor}</TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          <span>{product.marginMinor}</span>
                          <span className='text-xs text-muted-foreground'>
                            {product.marginRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{product.region}</TableCell>
                      <TableCell>
                        <Badge variant='secondary'>{product.status}</Badge>
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
                  : '商品将包含名称、类目、售价、成本、毛利率、目标站点和状态。'
              }
            />
          )}
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
    </div>
  )
}

/**
 * 竞品监测摘要卡：从共享 competitor_accounts 表读取真实账号并展示前 4 条。
 */
