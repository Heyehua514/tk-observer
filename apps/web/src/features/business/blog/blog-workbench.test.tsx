/** 商务工作台公众号分析 UI 自检；验证权限内只读指标、筛选和空态。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { BlogWorkbench } from './blog-workbench'
import { blogArticleKeys } from './use-blog-articles'

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getFullList: vi.fn().mockResolvedValue([]),
    }),
  },
}))

function renderWithArticles(data: unknown[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(blogArticleKeys.all, data)
  return render(
    <QueryClientProvider client={queryClient}>
      <BlogWorkbench />
    </QueryClientProvider>
  )
}

it('renders blog metrics and article rows with viral status', async () => {
  const screen = await renderWithArticles([
    {
      id: 'a1',
      title: 'TikTok 全域增长拆解',
      account: 'TK观察',
      publishDate: new Date().toISOString(),
      views: 32000,
      likes: 600,
      shares: 120,
      isViral: true,
      analysisNotes: '标题给出明确增长承诺',
      sourceUrl: 'https://example.com/a1',
    },
  ])

  await expect
    .element(
      screen.getByText(
        '公众号分析已接入对标账号与爆款沉淀，表格统一使用淡斑马纹和紧凑表头。'
      )
    )
    .toBeInTheDocument()
  await expect.element(screen.getByText('总文章数')).toBeInTheDocument()
  await expect.element(screen.getByText('爆款数')).toBeInTheDocument()
  await expect
    .element(screen.getByText('TikTok 全域增长拆解'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByText('爆款', { exact: true }))
    .toBeInTheDocument()
  await expect
    .element(screen.getByText('标题给出明确增长承诺'))
    .toBeInTheDocument()
})

it('shows guided empty state when filters return no rows', async () => {
  const screen = await renderWithArticles([
    {
      id: 'a1',
      title: '品牌出海方法论',
      account: 'TK观察',
      publishDate: '2026-08-01 00:00:00.000Z',
      views: 1800,
      likes: 30,
      shares: 10,
      isViral: false,
      analysisNotes: '',
      sourceUrl: '',
    },
  ])
  await screen.getByPlaceholder('搜索标题或分析笔记').fill('不存在')

  await expect
    .element(screen.getByText('还没有公众号文章记录'))
    .toBeInTheDocument()
  await expect
    .element(
      screen.getByText(
        '先录入一篇文章，系统会自动统计爆款状态、阅读表现和分析笔记。'
      )
    )
    .toBeInTheDocument()
})
