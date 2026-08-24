import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { CompetitorWorkbench } from './competitor-workbench'

vi.mock('@/features/editing/hooks/use-competitor-accounts', () => ({
  useCompetitorAccounts: () => ({
    data: [
      {
        id: 'account-1',
        name: '对标账号',
        platform: '视频号',
        profileUrl: '',
        category: '跨境电商',
        followerCount: 12500,
        averageViews: 10000,
        notes: '',
        created: '',
        updated: '2026-08-24 09:00:00.000Z',
      },
    ],
    isError: false,
  }),
  useUpdateCompetitorAccount: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('@/features/editing/hooks/use-competitor-videos', () => ({
  useCompetitorVideos: () => ({
    data: [
      {
        id: 'video-1',
        competitorId: 'account-1',
        title: '爆款视频',
        url: '',
        publishDate: '2026-08-20',
        views: 20000,
        likes: 1000,
        contentTags: '',
        whyViral: '',
        referenceTo: '',
        created: '',
        updated: '2026-08-24 09:00:00.000Z',
      },
    ],
  }),
  useCreateCompetitorVideo: () => ({ mutateAsync: vi.fn() }),
  useUpdateCompetitorVideo: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('@/features/editing/hooks/use-style-analyses', () => ({
  useStyleAnalyses: () => ({ data: [] }),
  styleAnalysisKeys: { all: ['style-analyses'] },
}))

vi.mock('@/features/editing/components/competitor-account-form', () => ({
  CompetitorAccountForm: () => null,
}))

vi.mock('@/features/editing/components/competitor-video-form', () => ({
  CompetitorVideoForm: () => null,
}))

vi.mock('@/features/editing/components/style-analysis-dialog', () => ({
  StyleAnalysisDialog: () => null,
  StyleAnalysisRecord: () => null,
}))

it('shows compact traffic metrics and the engagement baseline for a competitor video', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <CompetitorWorkbench query='' onQueryChange={vi.fn()} />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('1.3万')).toBeInTheDocument()
  await expect.element(screen.getByText('互动率 5%')).toBeInTheDocument()
  await expect.element(screen.getByText('高于均播')).toBeInTheDocument()
})
