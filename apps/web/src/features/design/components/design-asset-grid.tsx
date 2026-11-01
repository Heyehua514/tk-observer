/**
 * 设计素材库与审批操作主组件。
 * 路由：/design；权限：owner, boss, design；实时展示素材更新。
 */
import { useEffect, useRef, useState } from 'react'
import { regions } from '@/types/commerce'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Plus,
  Send,
  XCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { formatBeijingTime } from '@/lib/format'
import { useSearch } from '@/hooks/use-search'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { LoadStateError } from '@/components/shared/load-state-error'
import { SearchBar } from '@/components/shared/search-bar'
import { designAssetStatusLabels } from '../constants'
import {
  canReviewDesignAssets,
  resolveDesignAssetDeepLink,
} from '../design-asset-deep-link'
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
  const focusRef = useRef<HTMLElement | null>(null)
  const consumedReviewFocus = useRef('')
  const latestUpdate = assets.data?.reduce(
    (latest, item) => (item.updated > latest ? item.updated : latest),
    ''
  )
  const deepLink = resolveDesignAssetDeepLink({
    recordType: params.recordType,
    recordId: params.recordId,
    role,
    assets: assets.data,
    isLoading: assets.isLoading,
    isError: assets.isError,
  })
  const linkedAsset = deepLink.status === 'found' ? deepLink.asset : null
  const canReview = canReviewDesignAssets(role)
  const clearDeepLink = () =>
    onParamsChange({ recordType: undefined, recordId: undefined })
  const updateFilters = (patch: Partial<DesignAssetListParams>) =>
    onParamsChange({
      ...patch,
      recordType: undefined,
      recordId: undefined,
    })

  useEffect(() => {
    if (!linkedAsset) return
    focusRef.current?.scrollIntoView({ block: 'center' })
    if (
      canReview &&
      linkedAsset.status === 'pending_review' &&
      consumedReviewFocus.current !== linkedAsset.id
    ) {
      consumedReviewFocus.current = linkedAsset.id
      setReviewing(linkedAsset)
    }
  }, [canReview, linkedAsset])

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
          updateFilters({
            query: '',
            status: 'all',
            region: 'all',
            sort: '-updated',
          })
        }
      >
        <SearchBar
          value={params.query}
          onChange={(query) => updateFilters({ query })}
          placeholder='搜索文件名或尺寸'
        />
        <Select
          value={params.status}
          onValueChange={(status) =>
            updateFilters({
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
            updateFilters({
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
            updateFilters({ sort: sort as DesignAssetListParams['sort'] })
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

      {deepLink.status === 'missing' && (
        <Alert>
          <AlertCircle />
          <AlertTitle>目标素材不可用</AlertTitle>
          <AlertDescription className='flex flex-wrap items-center justify-between gap-2'>
            <span>该素材可能已被删除，或当前账号无权查看。</span>
            <Button variant='outline' size='sm' onClick={clearDeepLink}>
              查看全部素材
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {assets.isError && !assets.data?.length ? (
        <LoadStateError
          title='素材加载失败'
          description={
            deepLink.status === 'error'
              ? '无法确认目标素材状态，请检查数据服务和当前账号权限后重试。'
              : '请检查数据服务和当前账号权限后重试。'
          }
          onRetry={() => void assets.refetch()}
        />
      ) : assets.isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className='h-48 animate-pulse rounded-xl bg-muted' />
          ))}
        </div>
      ) : assets.data?.length ? (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
          {assets.data.map((asset) => {
            const StatusIcon = statusIcons[asset.status]
            const isFocused = linkedAsset?.id === asset.id
            return (
              <article
                key={asset.id}
                ref={isFocused ? focusRef : undefined}
                data-focused={isFocused ? 'true' : undefined}
                className={
                  isFocused
                    ? 'overflow-hidden rounded-xl border border-primary bg-card/70 ring-2 ring-primary/20 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none'
                    : 'overflow-hidden rounded-xl border bg-card/70 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 motion-reduce:transform-none motion-reduce:transition-none'
                }
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
                    {canReview && asset.status === 'pending_review' && (
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
