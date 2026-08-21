import { describe, expect, it } from 'vitest'
import { buildTaskContext } from './ai-context'

describe('AI task context', () => {
  it('removes sensitive fields and limits context to twelve prioritized tasks', () => {
    const tasks = Array.from({ length: 15 }, (_, index) => ({
      title: `任务 ${index}`,
      status: index === 0 ? 'overdue' : 'todo',
      dueAt: `2026-08-${String(index + 1).padStart(2, '0')}`,
      notes: '需要处理',
      password: 'secret',
      token: 'token',
    }))

    const context = buildTaskContext(tasks)
    expect(context).toHaveLength(12)
    expect(context[0].status).toBe('overdue')
    expect(context[0]).not.toHaveProperty('password')
    expect(context[0]).not.toHaveProperty('token')
  })
})
