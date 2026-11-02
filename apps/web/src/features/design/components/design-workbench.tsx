/** 设计工作台主体：素材库、设计任务看板与静态品牌规范。 */
import { useState } from 'react'
import {
  AlertCircle,
  BriefcaseBusiness,
  ClipboardCheck,
  Download,
  Image,
  PackageCheck,
  Palette,
  Rows3,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricDeck } from '@/components/shared/metric-deck'
import { PageHeader } from '@/components/shared/page-header'
import { AiAssistantPanel } from '@/features/shared-ai'
import { BrandGuidelinesBoard } from '../brand/brand-guidelines-board'
import { canAccessDesignAssets } from '../design-asset-deep-link'
import { useDesignAssets } from '../hooks/use-design-assets'
import { DesignRequirements } from '../requirements'
import { useDesignRequirements } from '../requirements/use-design-requirements'
import { DesignTasksBoard } from '../tasks'
import type { DesignAssetListParams } from '../types'
import { DesignAssetGrid } from './design-asset-grid'

const brandAssetParams: DesignAssetListParams = {
  query: '',
  status: 'all',
  region: 'all',
  sort: '-updated',
}

type DesignTab = 'requirements' | 'assets' | 'tasks' | 'brand'

export function DesignWorkbench({
  params,
  onParamsChange,
}: {
  params: DesignAssetListParams
  onParamsChange: (patch: Partial<DesignAssetListParams>) => void
}) {
  const role = useAuthStore((state) => state.user?.role)
  const canDesign = canAccessDesignAssets(role)
  const hasForbiddenAssetDeepLink =
    params.recordType === 'design_asset' &&
    Boolean(params.recordId) &&
    !canDesign
  const [selectedTab, setSelectedTab] = useState<DesignTab>(() =>
    canDesign && params.recordType === 'design_asset' && params.recordId
      ? 'assets'
      : 'requirements'
  )
  const brandAssets = useDesignAssets(brandAssetParams)
  const brandRequirements = useDesignRequirements('all')
  const assetCount = brandAssets.data?.length || 0
  const pendingAssetCount =
    brandAssets.data?.filter((asset) => asset.status === 'pending_review')
      .length || 0
  const deliveredRequirementCount =
    brandRequirements.data?.filter((item) => item.status === 'delivered')
      .length || 0

  const hasDeepLinkedAsset =
    canDesign &&
    params.recordType === 'design_asset' &&
    Boolean(params.recordId)
  const activeTab: DesignTab = hasDeepLinkedAsset ? 'assets' : selectedTab

  return (
    <div className='space-y-6'>
      <PageHeader
        title='设计工作台'
        description='集中维护业务素材、设计任务和品牌视觉规范。'
      />
      {hasForbiddenAssetDeepLink && (
        <Alert variant='destructive'>
          <AlertCircle />
          <AlertTitle>无法打开目标素材</AlertTitle>
          <AlertDescription className='flex flex-wrap items-center justify-between gap-2'>
            <span>当前账号无权查看设计素材库，或该素材已不可用。</span>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                onParamsChange({
                  recordType: undefined,
                  recordId: undefined,
                })
              }
            >
              返回设计需求
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const nextTab = value as DesignTab
          setSelectedTab(nextTab)
          if (nextTab !== 'assets' && hasDeepLinkedAsset) {
            onParamsChange({ recordType: undefined, recordId: undefined })
          }
        }}
      >
        <TabsList>
          <TabsTrigger value='requirements'>
            <BriefcaseBusiness className='size-4' />
            设计需求
          </TabsTrigger>
          {canDesign && (
            <TabsTrigger value='assets'>
              <Image className='size-4' />
              素材库
            </TabsTrigger>
          )}
          {canDesign && (
            <TabsTrigger value='tasks'>
              <Rows3 className='size-4' />
              设计任务
            </TabsTrigger>
          )}
          {canDesign && (
            <TabsTrigger value='brand'>
              <Palette className='size-4' />
              品牌规范
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value='requirements' className='mt-5'>
          <DesignRequirements />
        </TabsContent>
        {canDesign && (
          <TabsContent value='assets' className='mt-5'>
            <DesignAssetGrid params={params} onParamsChange={onParamsChange} />
          </TabsContent>
        )}
        {canDesign && (
          <TabsContent value='tasks' className='mt-5'>
            <DesignTasksBoard />
          </TabsContent>
        )}
        {canDesign && (
          <TabsContent value='brand' className='mt-5 space-y-6'>
            <MetricDeck
              aria-label='品牌规范数据概览'
              className='sm:grid-cols-3'
            >
              <BrandMetric
                icon={Image}
                label='设计资产'
                value={assetCount}
                description='当前可管理的素材总数'
              />
              <BrandMetric
                icon={ClipboardCheck}
                label='待审核素材'
                value={pendingAssetCount}
                description='等待确认后可进入交付'
              />
              <BrandMetric
                icon={PackageCheck}
                label='已交付需求'
                value={deliveredRequirementCount}
                description='已完成需求的交付沉淀'
              />
            </MetricDeck>
            {!assetCount && !brandRequirements.data?.length && (
              <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
                从上传第一份设计素材或创建设计需求开始沉淀品牌资产。
              </div>
            )}
            <BrandGuidelinesBoard />
            <Button variant='outline' disabled>
              <Download className='size-4' />
              Logo 文件待上传
            </Button>
          </TabsContent>
        )}
      </Tabs>
      <div className='mt-5'>
        <AiAssistantPanel
          scope='设计工作台'
          context={`当前设计资产 ${assetCount} 项、待审核 ${pendingAssetCount} 项、已交付需求 ${deliveredRequirementCount} 项。`}
        />
      </div>
    </div>
  )
}

function BrandMetric({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Image
  label: string
  value: number
  description: string
}) {
  return (
    <div className='rounded-lg border bg-card/60 p-4'>
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        {label}
        <Icon className='size-4 text-primary' />
      </div>
      <div className='mt-2 text-2xl font-semibold'>{value}</div>
      <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
    </div>
  )
}
