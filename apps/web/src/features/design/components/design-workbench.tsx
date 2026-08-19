/** 设计工作台主体：素材库、设计任务看板与静态品牌规范。 */
import {
  BriefcaseBusiness,
  ClipboardCheck,
  Download,
  Image,
  PackageCheck,
  Palette,
  Rows3,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricDeck } from '@/components/shared/metric-deck'
import { PageHeader } from '@/components/shared/page-header'
import { AiAssistantPanel } from '@/features/shared-ai'
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

export function DesignWorkbench({
  params,
  onParamsChange,
}: {
  params: DesignAssetListParams
  onParamsChange: (patch: Partial<DesignAssetListParams>) => void
}) {
  const role = useAuthStore((state) => state.user?.role)
  const canDesign = role === 'design' || role === 'boss'
  const brandAssets = useDesignAssets(brandAssetParams)
  const brandRequirements = useDesignRequirements('all')
  const assetCount = brandAssets.data?.length || 0
  const pendingAssetCount =
    brandAssets.data?.filter((asset) => asset.status === 'pending_review')
      .length || 0
  const deliveredRequirementCount =
    brandRequirements.data?.filter((item) => item.status === 'delivered')
      .length || 0
  return (
    <div className='space-y-6'>
      <PageHeader
        title='设计工作台'
        description='集中维护业务素材、设计任务和品牌视觉规范。'
      />
      <Tabs defaultValue='requirements'>
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
            <section>
              <h2 className='text-base font-medium'>品牌色</h2>
              <div className='mt-3 flex flex-wrap gap-4'>
                {[
                  { name: '深蓝黑', color: '#0F172A' },
                  { name: '强调蓝', color: '#2563EB' },
                  { name: '纯白', color: '#FFFFFF' },
                ].map((swatch) => (
                  <div
                    key={swatch.color}
                    className='flex items-center gap-3 rounded-xl border bg-card/60 p-3'
                  >
                    <span
                      className='size-9 rounded-md border'
                      style={{ background: swatch.color }}
                    />
                    <div>
                      <div className='text-sm font-medium'>{swatch.name}</div>
                      <div className='text-xs text-muted-foreground'>
                        {swatch.color}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className='text-base font-medium'>字体</h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                中文：PingFang SC / Microsoft YaHei；英文与数字：Inter
              </p>
            </section>
            <Button variant='outline' disabled>
              <Download className='size-4' />
              Logo 文件待上传
            </Button>
          </TabsContent>
        )}
      </Tabs>
      <div className='mt-5'>
        <AiAssistantPanel scope='设计工作台' />
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
