/** 设计任务 Supabase 映射层。 */
import type { Database } from '@/types/database.generated'
import type { DesignTask, DesignTaskInput, DesignTaskStatus } from './types'

type DesignTaskRow = Database['public']['Tables']['design_tasks']['Row']
type PartialRecord<T> = Partial<T> & Record<string, unknown>

export function mapSupabaseDesignTask(
  record: PartialRecord<DesignTaskRow>
): DesignTask {
  return {
    id: String(record.id || ''),
    title: String(record.title || ''),
    status: (record.status || 'todo') as DesignTaskStatus,
    dueAt: String(record.due_at || ''),
    region: record.region as DesignTask['region'],
  }
}

export function serializeSupabaseDesignTask(input: DesignTaskInput) {
  return {
    title: input.title,
    status: 'todo',
    due_at: input.dueAt || null,
    region: input.region,
  }
}
