/** 设计任务 Supabase 映射自检。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabaseDesignTask,
  serializeSupabaseDesignTask,
} from './design-task-supabase-mapper'

describe('design task Supabase mapper', () => {
  it('maps task rows to board cards', () => {
    expect(
      mapSupabaseDesignTask({
        id: 'task-1',
        title: '制作活动海报',
        status: 'doing',
        due_at: null,
        region: 'US',
      })
    ).toEqual({
      id: 'task-1',
      title: '制作活动海报',
      status: 'doing',
      dueAt: '',
      region: 'US',
    })
  })

  it('serializes task input to Supabase columns', () => {
    expect(
      serializeSupabaseDesignTask({
        title: '制作活动海报',
        dueAt: '2026-08-20',
        region: 'US',
      })
    ).toMatchObject({
      title: '制作活动海报',
      due_at: '2026-08-20',
      region: 'US',
      status: 'todo',
    })
  })
})
