/**
 * 全局搜索结果详情抽屉。
 * @description 根据 URL 中的 recordType/recordId 加载对应 PocketBase 记录。
 */
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { pb } from '@/lib/pocketbase'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { GlobalSearchKind } from '@/components/shared/global-search'

const collectionByKind = {
  creator: 'creators',
  company: 'companies',
  product: 'products',
  video: 'videos',
} as const

const labelsByKind = {
  creator: [
    ['达人昵称', 'nickname'],
    ['TikTok 主页', 'tiktok_url'],
    ['地区', 'region'],
  ],
  company: [
    ['公司名称', 'company_name'],
    ['联系人', 'contact_name'],
    ['地区', 'region'],
  ],
  product: [
    ['商品名称', 'name'],
    ['类目', 'category'],
    ['目标站点', 'region'],
  ],
  video: [
    ['视频标题', 'title'],
    ['关联达人', 'creator_name'],
    ['关联商品', 'product_name'],
  ],
} satisfies Record<GlobalSearchKind, readonly (readonly [string, string])[]>

function isSearchKind(value: unknown): value is GlobalSearchKind {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(collectionByKind, value)
  )
}

export function GlobalRecordDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const rawSearch = location.search as Record<string, unknown>
  const kind = isSearchKind(rawSearch.recordType) ? rawSearch.recordType : null
  const id = typeof rawSearch.recordId === 'string' ? rawSearch.recordId : ''
  const detail = useQuery({
    queryKey: ['global-record-detail', kind, id],
    queryFn: () =>
      pb
        .collection(collectionByKind[kind || 'creator'])
        .getOne(id, { expand: 'creator' }),
    enabled: !!kind && !!id,
  })
  const productName =
    kind === 'product' && detail.data ? String(detail.data.name || '') : ''
  const relatedVideos = useQuery({
    queryKey: ['global-product-videos', productName],
    queryFn: async () =>
      pb.collection('videos').getFullList({
        filter: pb.filter('product_name ~ {:productName}', { productName }),
        sort: '-updated',
      }),
    enabled: kind === 'product' && !!productName,
  })

  const close = async () => {
    const search = { ...rawSearch }
    delete search.recordType
    delete search.recordId
    await navigate({ to: location.pathname, search, replace: true })
  }

  return (
    <Sheet open={!!kind && !!id} onOpenChange={(open) => !open && void close()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>搜索结果详情</SheetTitle>
          <SheetDescription>已跳转到数据所属工作台</SheetDescription>
        </SheetHeader>
        <div className='px-4 pb-6'>
          {detail.isLoading ? (
            <div className='py-10 text-center text-sm text-muted-foreground'>
              正在加载记录…
            </div>
          ) : detail.data && kind ? (
            <>
              <dl className='grid grid-cols-[96px_1fr] gap-x-4 gap-y-4 text-sm'>
                {labelsByKind[kind].map(([label, field]) => (
                  <div key={field} className='contents'>
                    <dt className='text-muted-foreground'>{label}</dt>
                    <dd className='break-all'>
                      {field === 'creator_name'
                        ? String(
                            detail.data.expand?.creator?.nickname ||
                              detail.data[field] ||
                              '暂无'
                          )
                        : String(detail.data[field] || '暂无')}
                    </dd>
                  </div>
                ))}
              </dl>
              {kind === 'product' && (
                <section className='mt-6 border-t pt-5'>
                  <h3 className='text-sm font-medium'>关联视频</h3>
                  {relatedVideos.data?.length ? (
                    <div className='mt-3 space-y-2'>
                      {relatedVideos.data.map((video) => (
                        <div
                          key={video.id}
                          className='rounded-lg border p-3 text-sm'
                        >
                          <div className='font-medium'>
                            {String(video.title)}
                          </div>
                          <div className='mt-1 text-xs text-muted-foreground'>
                            {String(video.creator_name || '未关联达人')} ·{' '}
                            {String(video.region)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='mt-3 text-sm text-muted-foreground'>
                      暂无关联视频
                    </p>
                  )}
                </section>
              )}
            </>
          ) : (
            <div className='py-10 text-center text-sm text-muted-foreground'>
              记录不存在或您无权查看
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
