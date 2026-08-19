/** 商务工作台主体：达人 CRUD、客户/供应商及合作跟进看板入口。 */
import {
  Building2,
  Newspaper,
  CalendarDays,
  ChartNoAxesCombined,
  Handshake,
  KanbanSquare,
  ShoppingBag,
  UsersRound,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { AiAssistantPanel } from '@/features/shared-ai'
import { BlogWorkbench } from '../blog'
import { ClientsWorkbench } from '../clients'
import { BusinessDashboard } from '../dashboard'
import { OpportunitiesWorkbench } from '../opportunities'
import { OrdersWorkbench } from '../orders'
import { SocialWorkbench } from '../social'
import { SponsorshipsWorkbench } from '../sponsorships'
import type { CompanyListParams, CreatorListParams } from '../types'
import { CompanyTable } from './company-table'
import { CreatorTable } from './creator-table'

type BusinessTab =
  | 'dashboard'
  | 'creators'
  | 'companies'
  | 'clients'
  | 'opportunities'
  | 'orders'
  | 'social'
  | 'sponsorships'
  | 'blog'

export function BusinessWorkbench({
  params,
  companyParams,
  onParamsChange,
  onCompanyParamsChange,
  tab,
  onTabChange,
  focusType,
  focusId,
  onFocus,
}: {
  params: CreatorListParams
  companyParams: CompanyListParams
  onParamsChange: (patch: Partial<CreatorListParams>) => void
  onCompanyParamsChange: (patch: Partial<CompanyListParams>) => void
  tab: BusinessTab
  onTabChange: (tab: BusinessTab) => void
  focusType?: 'opportunity' | 'order'
  focusId?: string
  onFocus?: (type: 'opportunity' | 'order', id: string) => void
}) {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='商务工作台'
        description='维护达人关系、合作伙伴与合作推进状态。'
      />
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as typeof tab)}
      >
        <TabsList className='flex h-auto flex-wrap'>
          <TabsTrigger value='dashboard'>
            <ChartNoAxesCombined className='size-4' />
            经营驾驶舱
          </TabsTrigger>
          <TabsTrigger value='creators'>
            <UsersRound className='size-4' />
            达人管理
          </TabsTrigger>
          <TabsTrigger value='companies'>
            <Building2 className='size-4' />
            客户 / 供应商
          </TabsTrigger>
          <TabsTrigger value='clients'>
            <UsersRound className='size-4' />
            客户管理
          </TabsTrigger>
          <TabsTrigger value='opportunities'>
            <KanbanSquare className='size-4' />
            商机 Pipeline
          </TabsTrigger>
          <TabsTrigger value='orders'>
            <ShoppingBag className='size-4' />
            渠道商单
          </TabsTrigger>
          <TabsTrigger value='social'>
            <CalendarDays className='size-4' />
            朋友圈运营
          </TabsTrigger>
          <TabsTrigger value='sponsorships'>
            <Handshake className='size-4' />
            活动招商
          </TabsTrigger>
          <TabsTrigger value='blog'>
            <Newspaper className='size-4' />
            公众号分析
          </TabsTrigger>
        </TabsList>
        <TabsContent value='dashboard' className='mt-5'>
          <BusinessDashboard onNavigate={onTabChange} />
          <div className='mt-5'>
            <AiAssistantPanel scope='商务工作台' />
          </div>
        </TabsContent>
        <TabsContent value='creators' className='mt-5'>
          <CreatorTable params={params} onParamsChange={onParamsChange} />
        </TabsContent>
        <TabsContent value='companies' className='mt-5'>
          <CompanyTable
            params={companyParams}
            onParamsChange={onCompanyParamsChange}
          />
        </TabsContent>
        <TabsContent value='clients' className='mt-5'>
          <ClientsWorkbench onOpenRelated={onFocus} />
        </TabsContent>
        <TabsContent value='opportunities' className='mt-5'>
          <OpportunitiesWorkbench
            focusId={focusType === 'opportunity' ? focusId : undefined}
          />
        </TabsContent>
        <TabsContent value='orders' className='mt-5'>
          <OrdersWorkbench
            focusId={focusType === 'order' ? focusId : undefined}
          />
        </TabsContent>
        <TabsContent value='social' className='mt-5'>
          <SocialWorkbench />
        </TabsContent>
        <TabsContent value='sponsorships' className='mt-5'>
          <SponsorshipsWorkbench />
        </TabsContent>
        <TabsContent value='blog' className='mt-5'>
          <BlogWorkbench />
        </TabsContent>
      </Tabs>
    </div>
  )
}
