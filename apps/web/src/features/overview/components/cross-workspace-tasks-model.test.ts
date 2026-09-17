import { describe, expect, it } from 'vitest'
import {
  filterPendingTasks,
  isTaskOverdue,
  type CrossWorkspaceTask,
} from './cross-workspace-tasks-model'

describe('cross-workspace-tasks-model', () => {
  const baseNow = new Date('2026-09-17T12:00:00Z')

  it('correctly detects overdue tasks', () => {
    expect(isTaskOverdue('2026-09-16T12:00:00Z', baseNow)).toBe(true)
    expect(isTaskOverdue('2026-09-18T12:00:00Z', baseNow)).toBe(false)
    expect(isTaskOverdue(undefined, baseNow)).toBe(false)
  })

  it('categorizes overdue, due soon, and normal tasks', () => {
    const tasks: CrossWorkspaceTask[] = [
      { id: '1', title: '主图设计', workspace: 'design', status: 'in_progress', dueAt: '2026-09-16T10:00:00Z' },
      { id: '2', title: '爆款剪辑', workspace: 'editing', status: 'draft', dueAt: '2026-09-17T18:00:00Z' },
      { id: '3', title: '大客户商机', workspace: 'business', status: 'negotiating', dueAt: '2026-09-25T12:00:00Z' },
      { id: '4', title: '已结单商机', workspace: 'business', status: 'won', dueAt: '2026-09-15T12:00:00Z' },
    ]

    const res = filterPendingTasks(tasks, baseNow)
    expect(res.overdue.map((t) => t.id)).toEqual(['1'])
    expect(res.dueSoon.map((t) => t.id)).toEqual(['2'])
    expect(res.normal.map((t) => t.id)).toEqual(['3'])
  })
})
