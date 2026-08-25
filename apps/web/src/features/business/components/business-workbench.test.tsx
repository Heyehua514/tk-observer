import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { BusinessWorkbench } from './business-workbench'

vi.mock('../../blog', () => ({
  BlogWorkbench: () => <div>公众号分析占位</div>,
}))
vi.mock('../../clients', () => ({
  ClientsWorkbench: () => <div>客户管理占位</div>,
}))
vi.mock('../../dashboard', () => ({
  BusinessDashboard: () => <div>经营驾驶舱占位</div>,
}))
vi.mock('../../opportunities', () => ({
  OpportunitiesWorkbench: () => <div>商机 Pipeline 占位</div>,
}))
vi.mock('../../orders', () => ({
  OrdersWorkbench: () => <div>渠道商单占位</div>,
}))
vi.mock('../../social', () => ({
  SocialWorkbench: () => <div>朋友圈运营占位</div>,
}))
vi.mock('../../sponsorships', () => ({
  SponsorshipsWorkbench: () => <div>活动招商占位</div>,
}))
vi.mock('@/features/shared-ai', () => ({
  AiAssistantPanel: ({ scope }: { scope: string }) => (
    <div>{`AI 助手入口:${scope}`}</div>
  ),
  TaskAiEntry: () => null,
}))

const noopParams = {
  page: 1,
  perPage: 20,
  query: '',
  region: 'all',
  status: 'all',
  sort: '-updated',
} as const

function renderWorkbench(tab: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BusinessWorkbench
        params={{ ...noopParams } as never}
        companyParams={{ ...noopParams } as never}
        onParamsChange={vi.fn()}
        onCompanyParamsChange={vi.fn()}
        tab={tab as never}
        onTabChange={vi.fn()}
      />
    </QueryClientProvider>
  )
}

it('keeps the core tabs visible and folds others into a more-menu', async () => {
  const screen = await renderWorkbench('dashboard')
  for (const label of [
    '经营驾驶舱',
    '达人管理',
    '客户管理',
    '商机 Pipeline',
    '渠道商单',
    '朋友圈运营',
    '更多',
  ]) {
    await expect.element(screen.getByText(label)).toBeInTheDocument()
  }
  await expect
    .element(screen.getByText('AI 助手入口:商务工作台'))
    .toBeInTheDocument()

  // 折叠项不在主 Tab 栏可见，需点“更多”按钮
  await userEvent.click(screen.getByRole('button', { name: '更多功能' }))
  await expect.element(screen.getByText('客户 / 供应商')).toBeInTheDocument()
  await expect.element(screen.getByText('活动招商')).toBeInTheDocument()
  await expect.element(screen.getByText('公众号分析')).toBeInTheDocument()
})
