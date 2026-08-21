/**
 * 对标账号分析主页面。
 * 路由：/editing?section=competitors；权限：editing, boss。
 */
import { useState } from 'react'
import { ExternalLink, Pencil, Plus, ScanSearch, UserRound } from 'lucide-react'
import { formatBeijingTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadStateError } from '@/components/shared/load-state-error'
import { SearchBar } from '@/components/shared/search-bar'
import { useCompetitorAccounts } from '../hooks/use-competitor-accounts'
import { useCompetitorVideos } from '../hooks/use-competitor-videos'
import { useStyleAnalyses } from '../hooks/use-style-analyses'
import type { CompetitorAccount, CompetitorVideo } from '../types'
import { CompetitorAccountForm } from './competitor-account-form'
import { CompetitorVideoForm } from './competitor-video-form'
import { editingPermissionErrorDescription } from './editing-empty-copy'
import {
  StyleAnalysisDialog,
  StyleAnalysisRecord,
} from './style-analysis-dialog'

export function CompetitorWorkbench({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (query: string) => void
}) {
  const accounts = useCompetitorAccounts(query)
  const [selectedId, setSelectedId] = useState('')
  const [editingAccount, setEditingAccount] =
    useState<CompetitorAccount | null>(null)
  const [analyzingAccount, setAnalyzingAccount] =
    useState<CompetitorAccount | null>(null)
  const [editingVideo, setEditingVideo] = useState<CompetitorVideo | null>(null)
  const [videoFormOpen, setVideoFormOpen] = useState(false)
  const activeId = selectedId || accounts.data?.[0]?.id || ''
  const selected =
    accounts.data?.find((account) => account.id === activeId) || null
  const videos = useCompetitorVideos(activeId)
  const analyses = useStyleAnalyses(activeId)
  const latestUpdate = [...(accounts.data || []), ...(videos.data || [])]
    .map((record) => record.updated)
    .reduce((latest, current) => (current > latest ? current : latest), '')
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <SearchBar
          value={query}
          onChange={onQueryChange}
          placeholder='搜索对标账号或备注'
        />
        <span className='text-sm text-muted-foreground'>
          {latestUpdate
            ? `数据更新于 ${formatBeijingTime(latestUpdate)}`
            : '爆款视频由谢洁手动录入'}
        </span>
      </div>
      {accounts.isError ? (
        <LoadStateError
          title='对标账号加载失败'
          description={editingPermissionErrorDescription}
          onRetry={() => void accounts.refetch()}
        />
      ) : (
        <div className='grid gap-4 md:grid-cols-3'>
          {accounts.data?.map((account) => (
            <article
              key={account.id}
              className={`rounded-xl border p-4 transition-colors ${activeId === account.id ? 'border-primary bg-primary/10 dark:bg-primary/15' : 'bg-card/70 hover:border-primary/30'}`}
            >
              <button
                className='w-full text-left'
                onClick={() => setSelectedId(account.id)}
              >
                <div className='flex items-start gap-3'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted'>
                    <UserRound className='size-5' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='truncate font-medium'>{account.name}</h3>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {account.platform} · {account.category}
                    </p>
                  </div>
                </div>
                <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <div className='text-muted-foreground'>粉丝数</div>
                    <div className='mt-1 font-medium'>
                      {account.followerCount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground'>平均播放量</div>
                    <div className='mt-1 font-medium'>
                      {account.averageViews.toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
              <div className='mt-4 flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setEditingAccount(account)}
                >
                  <Pencil className='size-4' />
                  编辑
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setAnalyzingAccount(account)}
                >
                  <ScanSearch className='size-4' />
                  分析风格
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <section className='space-y-4 border-t pt-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold'>
                {selected.name} · 爆款视频
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                按播放量降序，支持持续补充分析笔记。
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingVideo(null)
                setVideoFormOpen(true)
              }}
            >
              <Plus className='size-4' />
              新增视频
            </Button>
          </div>
          {videos.data?.length ? (
            <div className='space-y-3'>
              {videos.data.map((video) => (
                <article
                  key={video.id}
                  className='rounded-xl border bg-card/70 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 motion-reduce:transform-none motion-reduce:transition-none'
                >
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <h3 className='font-medium'>{video.title}</h3>
                      <div className='mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground'>
                        <Badge variant='secondary'>
                          播放 {video.views.toLocaleString()}
                        </Badge>
                        <Badge variant='secondary'>
                          点赞 {video.likes.toLocaleString()}
                        </Badge>
                        <span>{video.publishDate || '未填日期'}</span>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      {video.url && (
                        <Button size='icon' variant='ghost' asChild>
                          <a
                            href={video.url}
                            target='_blank'
                            rel='noreferrer'
                            aria-label='打开视频'
                          >
                            <ExternalLink className='size-4' />
                          </a>
                        </Button>
                      )}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setEditingVideo(video)
                          setVideoFormOpen(true)
                        }}
                      >
                        <Pencil className='size-4' />
                        分析笔记
                      </Button>
                    </div>
                  </div>
                  <div className='mt-4 grid gap-4 md:grid-cols-2'>
                    <div>
                      <h4 className='text-sm font-medium'>为什么爆</h4>
                      <p className='mt-1 text-sm whitespace-pre-wrap text-muted-foreground'>
                        {video.whyViral || '待分析'}
                      </p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium'>可借鉴点</h4>
                      <p className='mt-1 text-sm whitespace-pre-wrap text-muted-foreground'>
                        {video.referenceTo || '待分析'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title='等待对标视频沉淀'
              description='打开该账号的视频号，手动录入值得分析的爆款视频。'
            />
          )}
          {analyses.data?.length ? (
            <div className='space-y-4 border-t pt-6'>
              <h2 className='text-lg font-semibold'>风格分析历史</h2>
              {analyses.data.map((analysis) => (
                <article key={analysis.id} className='space-y-3'>
                  <div className='text-sm font-medium'>
                    {analysis.analyzedAt}
                  </div>
                  <StyleAnalysisRecord analysis={analysis} />
                </article>
              ))}
            </div>
          ) : null}
        </section>
      )}
      <CompetitorAccountForm
        account={editingAccount}
        open={Boolean(editingAccount)}
        onOpenChange={(open) => !open && setEditingAccount(null)}
      />
      <StyleAnalysisDialog
        account={analyzingAccount}
        open={Boolean(analyzingAccount)}
        onOpenChange={(open) => !open && setAnalyzingAccount(null)}
      />
      <CompetitorVideoForm
        competitorId={activeId}
        video={editingVideo}
        open={videoFormOpen}
        onOpenChange={setVideoFormOpen}
      />
    </div>
  )
}
