/** 设计工作台主体：素材库、设计任务看板与静态品牌规范。 */
import {
  BriefcaseBusiness,
  Download,
  Image,
  Palette,
  Rows3,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DesignRequirements } from '../requirements'
import { DesignTasksBoard } from '../tasks'
import type { DesignAssetListParams } from '../types'
import { DesignAssetGrid } from './design-asset-grid'

export function DesignWorkbench({
  params,
  onParamsChange,
}: {
  params: DesignAssetListParams
  onParamsChange: (patch: Partial<DesignAssetListParams>) => void
}) {
  const role = useAuthStore((state) => state.user?.role)
  const canDesign = role === 'design' || role === 'boss'
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
    </div>
  )
}
