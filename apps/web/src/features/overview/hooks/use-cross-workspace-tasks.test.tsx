import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import {
  mapAndSortCrossWorkspaceTasks,
  useCrossWorkspaceTasks,
  type RawOverviewActionItemRow,
} from './use-cross-workspace-tasks'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'supabase',
}))
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({ rpc }),
}))

beforeEach(() => {
  rpc.mockReset()
})

describe('mapAndSortCrossWorkspaceTasks', () => {
  it('maps all workspaces, keeps team ownership and sorts by due date', () => {
    const rows: RawOverviewActionItemRow[] = [
      {
        workspace: 'business',
        record_id: 'o1',
        title: '商单跟进',
        status: 'negotiation',
        due_at: '2026-10-22T00:00:00Z',
      },
      {
        workspace: 'team',
        record_id: 't1',
        title: '团队任务',
        status: 'in_progress',
        due_at: '2026-10-19T08:00:00Z',
        assignee_name: '董雨辰',
        source_intelligence_id: 'intel-1',
      },
      {
        workspace: 'editing',
        record_id: 'v1',
        title: '剪辑任务',
        status: 'editing',
        due_at: null,
        assignee_name: '谢洁',
      },
      {
        workspace: 'unknown',
        record_id: 'x1',
        title: '未知工作台',
        status: 'todo',
      },
    ]

    const result = mapAndSortCrossWorkspaceTasks(rows)

    expect(result.map((task) => task.id)).toEqual([
      'team-t1',
      'business-o1',
      'editing-v1',
    ])
    expect(result[0]).toMatchObject({
      workspace: 'team',
      assigneeName: '董雨辰',
      sourceIntelligenceId: 'intel-1',
    })
    expect(result[2].dueAt).toBeUndefined()
  })
})

function TaskProbe() {
  const { data = [] } = useCrossWorkspaceTasks()

  return (
    <p>
      {data.map((task) => `${task.workspace}:${task.assigneeName}`).join('|')}
    </p>
  )
}

describe('useCrossWorkspaceTasks', () => {
  it('reads the unified overview RPC instead of querying four tables', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          workspace: 'team',
          record_id: 't1',
          title: '团队任务',
          status: 'in_progress',
          due_at: '2026-11-08T08:00:00Z',
          assignee_name: '董雨辰',
          source_intelligence_id: 'intel-1',
        },
      ],
      error: null,
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <TaskProbe />
      </QueryClientProvider>
    )

    await vi.waitFor(() => {
      expect(rpc).toHaveBeenCalledWith('get_overview_action_items', {
        p_limit: 50,
      })
    })
    await expect.element(screen.getByText('team:董雨辰')).toBeInTheDocument()
  })
})
