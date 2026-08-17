/** 市场资源库 UI 测试：活动物料与设计需求前端关联展示。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { MarketResourcesWorkbench } from './market-resources-workbench'

vi.mock('@/features/design/requirements/use-design-requirements', () => ({
  useApprovedDesignAssets: () => ({ data: [] }),
  useCreateDesignDeliverable: () => ({ mutate: vi.fn() }),
  useCreateDesignReference: () => ({ mutate: vi.fn() }),
  useDesignRequirements: () => ({
    data: [
      {
        id: 'req-1',
        title: '金鳞会主KV',
        status: 'pending',
        dueDate: '2026-08-20',
      },
    ],
  }),
  useRequirementRelations: () => ({
    data: { references: [], deliverables: [] },
  }),
  useUpdateRequirementStatus: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/features/market/resources/use-market-resources', () => ({
  useEventTemplates: () => ({ data: [] }),
  useResourceEvents: () => ({ data: [] }),
  useMarkTemplateUsed: () => ({ mutateAsync: vi.fn() }),
  useSaveTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSaveMaterial: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSaveFinance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEventFinances: () => ({ data: [] }),
  useEventMaterials: () => ({
    data: [
      {
        id: 'mat-1',
        eventId: 'event-1',
        eventName: '厦门沙龙',
        type: 'key_visual',
        name: '厦门沙龙主KV',
        file: '',
        status: 'designing',
        notes: 'design:req-1 物料来自设计需求',
      },
    ],
  }),
}))

it('物料卡展示可跳转的关联设计需求', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <MarketResourcesWorkbench />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('tab', { name: '物料管理' }))

  await expect.element(screen.getByText('厦门沙龙主KV')).toBeInTheDocument()
  await expect.element(screen.getByText('关联设计需求')).toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: /金鳞会主KV/ }))
    .toBeInTheDocument()
})
