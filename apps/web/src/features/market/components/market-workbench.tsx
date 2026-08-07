/** 市场工作台主体：选品库、竞品、投放数据和活动排期骨架。 */
import {
  BarChart3,
  CalendarDays,
  FileStack,
  MapPinned,
  PackageSearch,
  Radar,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchBar } from '@/components/shared/search-bar'
import { useMarketWorkbench } from '../hooks/use-market-workbench'
import { MarketResourcesWorkbench } from '../resources'
import { VenuesWorkbench } from '../venues'
import { EventsPanel } from './market-records'

export function MarketWorkbench({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (query: string) => void
}) {
  const activeQuery = useMarketWorkbench(query)
  const adData = [
    { region: 'US', value: 0 },
    { region: 'UK', value: 0 },
    { region: 'TH', value: 0 },
    { region: 'ID', value: 0 },
  ]
  return (
    <div className='space-y-6'>
      <PageHeader
        title='市场工作台'
        description='管理选品、竞品情报、站点投放和活动节奏。'
      />
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
          <EmptyState
            title='选品库暂无商品'
            description='商品将包含名称、类目、售价、成本、毛利率、目标站点和状态。'
          />
        </TabsContent>
        <TabsContent value='competitors' className='mt-5'>
          <EmptyState
            title='尚未添加竞品'
            description='添加竞品店铺或商品后，在这里跟踪价格与内容变化。'
          />
        </TabsContent>
        <TabsContent value='ads' className='mt-5'>
          <div className='h-72 rounded-lg border p-5'>
            <h3 className='mb-4 text-sm font-medium'>按站点投放数据</h3>
            <ResponsiveContainer width='100%' height='85%'>
              <BarChart data={adData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey='region' />
                <YAxis />
                <Bar
                  dataKey='value'
                  fill='#2563eb'
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
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
