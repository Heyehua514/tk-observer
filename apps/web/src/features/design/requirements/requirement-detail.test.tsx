/** 设计需求详情 UI 测试：展示与活动物料的前端关联。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { RequirementDetail } from './requirement-detail'
import type { DesignRequirement } from './types'

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: 'design' } }),
}))

vi.mock('@/features/market/resources/use-market-resources', () => ({
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
        notes: 'design:req-1 设计需求关联',
      },
    ],
  }),
}))

vi.mock('./use-design-requirements', () => ({
  useApprovedDesignAssets: () => ({ data: [] }),
  useCreateDesignDeliverable: () => ({ mutate: vi.fn() }),
  useCreateDesignReference: () => ({ mutate: vi.fn() }),
  useRequirementRelations: () => ({
    data: {
      references: [],
      deliverables: [
        {
          id: 'delivery-2',
          asset: 'asset-2',
          assetName: '主KV-v2.png',
          exportedSize: '1080x1920',
          exportedFormat: 'png',
          checklistOk: true,
          deliveredAt: '2026-08-16T10:00:00.000Z',
        },
        {
          id: 'delivery-1',
          asset: 'asset-1',
          assetName: '主KV-v1.png',
          exportedSize: '1080x1920',
          exportedFormat: 'png',
          checklistOk: false,
          deliveredAt: '2026-08-14T10:00:00.000Z',
        },
      ],
    },
  }),
  useUpdateRequirementStatus: () => ({ mutate: vi.fn() }),
}))

const requirement: DesignRequirement = {
  id: 'req-1',
  title: '金鳞会主KV',
  description: '活动主视觉',
  requester: 'boss-user',
  targetSize: '1080x1920',
  usageScene: '朋友圈宣发',
  copyContent: '金鳞会闭门沙龙',
  deliveryFormat: 'png',
  referenceUrls: '',
  status: 'pending',
  priority: '高',
  dueDate: '2026-08-20',
  created: '2026-08-17',
}

it('关联物料 Tab 展示匹配到的活动物料', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <RequirementDetail
        requirement={requirement}
        open
        onOpenChange={vi.fn()}
      />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('tab', { name: '关联物料' }))

  await expect.element(screen.getByText('厦门沙龙主KV')).toBeInTheDocument()
  await expect
    .element(screen.getByText('厦门沙龙', { exact: true }))
    .toBeInTheDocument()
})
