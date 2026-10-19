import { describe, expect, it } from 'vitest'
import {
  mapAndSortCrossWorkspaceTasks,
  type RawDesignTaskRow,
  type RawVideoTaskRow,
  type RawOpportunityRow,
} from './use-cross-workspace-tasks'

describe('mapAndSortCrossWorkspaceTasks', () => {
  it('filters out completed items and sorts by due date', () => {
    const design: RawDesignTaskRow[] = [
      { id: 'd1', title: '海报设计', status: 'doing', due_at: '2026-10-20T10:00:00Z' },
      { id: 'd2', title: '主图完成', status: 'done', due_at: '2026-10-18T10:00:00Z' },
    ]
    const video: RawVideoTaskRow[] = [
      { id: 'v1', title: '剪辑任务急件', status: 'editing', due_at: '2026-10-19T08:00:00Z', owner_name: '谢洁' },
      { id: 'v2', title: '已结视频', status: 'done', due_at: '2026-10-15T00:00:00Z' },
    ]
    const opp: RawOpportunityRow[] = [
      { id: 'o1', title: '商单跟进', stage: 'negotiation', expected_close: '2026-10-22T00:00:00Z' },
      { id: 'o2', title: '已赢单', stage: 'won', expected_close: '2026-10-10T00:00:00Z' },
      { id: 'o3', title: '无截止商机', stage: 'contact', expected_close: null },
    ]

    const result = mapAndSortCrossWorkspaceTasks(design, video, opp)

    expect(result).toHaveLength(4)
    // Earliest due date first
    expect(result[0].id).toBe('editing-v1')
    expect(result[0].workspace).toBe('editing')
    expect(result[0].assigneeName).toBe('谢洁')

    expect(result[1].id).toBe('design-d1')
    expect(result[2].id).toBe('business-o1')
    expect(result[3].id).toBe('business-o3')
    expect(result[3].dueAt).toBeUndefined()
  })
})
