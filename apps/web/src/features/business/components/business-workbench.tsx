/** 商务工作台主体：达人 CRUD、客户/供应商及合作跟进看板入口。 */
import { Building2, Columns3, Plus, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import type { CreatorListParams } from '../types'
import { CreatorTable } from './creator-table'

export function BusinessWorkbench({
  params,
  onParamsChange,
}: {
  params: CreatorListParams
  onParamsChange: (patch: Partial<CreatorListParams>) => void
}) {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='商务工作台'
        description='维护达人关系、合作伙伴与合作推进状态。'
      />
      <Tabs defaultValue='creators'>
        <TabsList>
          <TabsTrigger value='creators'>
            <UsersRound className='size-4' />
            达人管理
          </TabsTrigger>
          <TabsTrigger value='companies'>
            <Building2 className='size-4' />
            客户 / 供应商
          </TabsTrigger>
          <TabsTrigger value='followups'>
            <Columns3 className='size-4' />
            合作跟进
          </TabsTrigger>
        </TabsList>
        <TabsContent value='creators' className='mt-5'>
          <CreatorTable params={params} onParamsChange={onParamsChange} />
        </TabsContent>
        <TabsContent value='companies' className='mt-5'>
          <EmptyState
            title='客户与供应商名录待建立'
            description='下一轮可按达人管理模板接入 companies collection。'
            action={
              <Button disabled>
                <Plus className='size-4' />
                新增公司
              </Button>
            }
          />
        </TabsContent>
        <TabsContent value='followups' className='mt-5'>
          <div className='grid gap-4 md:grid-cols-4'>
            {['待接触', '沟通中', '已签约', '已终止'].map((title) => (
              <div
                key={title}
                className='min-h-64 rounded-lg border bg-muted/20 p-3'
              >
                <h3 className='text-sm font-medium'>{title}</h3>
                <p className='mt-8 text-center text-sm text-muted-foreground'>
                  暂无合作记录
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
