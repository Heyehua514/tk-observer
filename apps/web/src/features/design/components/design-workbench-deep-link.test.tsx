/** 设计通知深链测试；权限：design 定位素材，boss 自动打开待审素材。 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import type { DesignAsset, DesignAssetListParams } from '../types'
import { DesignWorkbench } from './design-workbench'

const authState = vi.hoisted(() => ({ role: 'design' }))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (state: { user: { id: string; role: string } }) => unknown
  ) => selector({ user: { id: 'reviewer-1', role: authState.role } }),
}))

vi.mock('@/features/shared-ai', () => ({
  AiAssistantPanel: ({ scope }: { scope: string }) => (
    <div>{`AI 助手入口:${scope}`}</div>
  ),
  TaskAiEntry: () => null,
}))

const assets: DesignAsset[] = [
  {
    id: 'asset-1',
    fileName: '已通过素材.png',
    file: '',
    fileUrl: '',
    dimensions: '1080x1080',
    region: 'US',
    status: 'approved',
    owner: 'designer-1',
    reviewReason: '',
    reviewedBy: 'reviewer-1',
    reviewedAt: '2026-10-29T01:00:00.000Z',
    created: '2026-10-29T00:00:00.000Z',
    updated: '2026-10-29T01:00:00.000Z',
  },
  {
    id: 'asset-2',
    fileName: '待审素材.png',
    file: '',
    fileUrl: '',
    dimensions: '1080x1920',
    region: 'UK',
    status: 'pending_review',
    owner: 'designer-1',
    reviewReason: '',
    reviewedBy: '',
    reviewedAt: '',
    created: '2026-10-29T00:00:00.000Z',
    updated: '2026-10-29T02:00:00.000Z',
  },
]

const baseParams: DesignAssetListParams = {
  query: '',
  status: 'all',
  region: 'all',
  sort: '-updated',
}

const linkedParams: DesignAssetListParams = {
  ...baseParams,
  recordType: 'design_asset',
  recordId: 'asset-2',
}

function renderWorkbench() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(['design-assets', 'list', baseParams], assets)
  queryClient.setQueryData(['design-assets', 'list', linkedParams], assets)
  queryClient.setQueryData(['design', 'requirements', 'all'], [])
  queryClient.setQueryData(['design', 'tasks'], [])
  return render(
    <QueryClientProvider client={queryClient}>
      <DesignWorkbench params={linkedParams} onParamsChange={vi.fn()} />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  authState.role = 'design'
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('opens the asset tab and focuses the linked design asset', async () => {
  const scrollIntoView = vi
    .spyOn(HTMLElement.prototype, 'scrollIntoView')
    .mockImplementation(() => undefined)
  const screen = await renderWorkbench()

  await expect
    .element(screen.getByRole('tab', { name: '素材库' }))
    .toHaveAttribute('aria-selected', 'true')
  await expect
    .element(screen.getByRole('heading', { name: '待审素材.png' }))
    .toBeInTheDocument()
  await vi.waitFor(() => {
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
  })

  const focused = document.querySelector('article[data-focused="true"]')
  expect(focused?.textContent).toContain('待审素材.png')
})

it('opens the pending review dialog automatically for a boss deep link', async () => {
  authState.role = 'boss'
  const screen = await renderWorkbench()

  await expect
    .element(screen.getByRole('heading', { name: '审核设计稿' }))
    .toBeInTheDocument()
})
