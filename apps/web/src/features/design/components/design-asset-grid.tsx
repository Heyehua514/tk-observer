/**
 * 设计素材库与审批操作主组件。
 * 路由：/design；权限：design, boss；实时展示素材更新。
 */
import { useState } from 'react'
import { regions } from '@/types/commerce'
import { CheckCircle2, Clock3, Plus, Send, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { formatBeijingTime } from '@/lib/format'
import { useSearch } from '@/hooks/use-search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterBar } from '@/components/shared/filter-bar'
import { SearchBar } from '@/components/shared/search-bar'
import { designAssetStatusLabels } from '../constants'
import { useDesignAssets } from '../hooks/use-design-assets'
import { useUpdateDesignAssetStatus } from '../hooks/use-update-design-asset-status'
import type {
  DesignAsset,
  DesignAssetListParams,
  DesignAssetStatus,
} from '../types'
import { DesignAssetUploadDialog } from './design-asset-upload-dialog'
import { DesignReviewDialog } from './design-review-dialog'

const statusIcons = {
  draft: Clock3,
  pending_review: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
} satisfies Record<DesignAssetStatus, typeof Clock3>

export function DesignAssetGrid({
  params,
  onParamsChange,
}: {
  params: DesignAssetListParams
  onParamsChange: (patch: Partial<DesignAssetListParams>) => void
}) {
  const role = useAuthStore((state) => state.user?.role)
  const queryParams = useSearch(params)
  const assets = useDesignAssets(queryParams)
  const updateStatus = useUpdateDesignAssetStatus()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [reviewing, setReviewing] = useState<DesignAsset | null>(null)
  const latestUpdate = assets.data?.reduce(
    (latest, item) => (item.updated > latest ? item.updated : latest),
    ''
  )

  return (
    <div className='space-y-4'>
      <div className='flex min-h-9 items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>
          {latestUpdate
            ? `数据更新于 ${formatBeijingTime(latestUpdate)}`
            : '等待首份素材'}
        </p>
        {role === 'design' && (
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className='size-4' />
            上传素材
          </Button>
        )}
      </div>

      <FilterBar
        onReset={() =>
          onParamsChange({
            query: '',
            status: 'all',
            region: 'all',
            sort: '-updated',
          })
        }
      >
        <SearchBar
          value={params.query}
          onChange={(query) => onParamsChange({ query })}
          placeholder='搜索文件名或尺寸'
        />
        <Select
          value={params.status}
          onValueChange={(status) =>
            onParamsChange({
              status: status as DesignAssetListParams['status'],
            })
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='状态' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部状态</SelectItem>
            {Object.entries(designAssetStatusLabels).map(([status, label]) => (
              <SelectItem key={status} value={status}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.region}
          onValueChange={(region) =>
            onParamsChange({
              region: region as DesignAssetListParams['region'],
            })
          }
        >
          <SelectTrigger className='w-28'>
            <SelectValue placeholder='站点' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部站点</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.sort}
          onValueChange={(sort) =>
            onParamsChange({ sort: sort as DesignAssetListParams['sort'] })
          }
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='排序' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='-updated'>最近更新</SelectItem>
            <SelectItem value='-created'>最近上传</SelectItem>
            <SelectItem value='file_name'>文件名 A-Z</SelectItem>
            <SelectItem value='-file_name'>文件名 Z-A</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {assets.isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className='h-48 animate-pulse rounded-xl bg-muted' />
          ))}
        </div>
      ) : assets.data?.length ? (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
          {assets.data.map((asset) => {
            const StatusIcon = statusIcons[asset.status]
            return (
              <article
                key={asset.id}
                className='overflow-hidden rounded-xl border bg-card/70 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30'
              >
                <div className='flex aspect-[3/2] items-center justify-center bg-muted/30'>
                  {asset.fileUrl ? (
                    <img
                      src={asset.fileUrl}
                      alt={asset.fileName}
                      className='size-full object-cover'
                    />
                  ) : (
                    <span className='text-sm text-muted-foreground'>
                      暂无预览
                    </span>
                  )}
                </div>
                <div className='space-y-3 p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <h3 className='truncate text-sm font-medium'>
                        {asset.fileName}
                      </h3>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {asset.dimensions || '未标注尺寸'} · {asset.region}
                      </p>
                    </div>
                    <Badge variant='secondary' className='shrink-0'>
                      <StatusIcon className='size-3' />
                      {designAssetStatusLabels[asset.status]}
                    </Badge>
                  </div>
                  {asset.status === 'rejected' && asset.reviewReason && (
                    <p className='rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive'>
                      驳回理由：{asset.reviewReason}
                    </p>
                  )}
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-xs text-muted-foreground'>
                      {formatBeijingTime(asset.updated)}
                    </span>
                    {role === 'design' &&
                      (asset.status === 'draft' ||
                        asset.status === 'rejected') && (
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate({
                              id: asset.id,
                              status: 'pending_review',
                            })
                          }
                        >
                          <Send className='size-4' />
                          提交审核
                        </Button>
                      )}
                    {role === 'boss' && asset.status === 'pending_review' && (
                      <Button size='sm' onClick={() => setReviewing(asset)}>
                        审核
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title='素材库还是空的'
          description='设计人员上传第一份素材后，可在这里提交审核。'
          action={
            role === 'design' ? (
              <Button onClick={() => setUploadOpen(true)}>
                <Plus className='size-4' />
                上传素材
              </Button>
            ) : undefined
          }
        />
      )}

      <DesignAssetUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <DesignReviewDialog
        asset={reviewing}
        open={!!reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
      />
    </div>
  )
}
