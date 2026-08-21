export type AiTaskContext = {
  title: string
  status: string
  dueAt: string
  notes: string
  source?: string
}

type RawTask = Record<string, unknown>

function priority(task: AiTaskContext) {
  if (task.status === 'overdue') return 0
  if (task.status === 'todo' || task.status === 'pending') return 1
  return 2
}

export function buildTaskContext(tasks: RawTask[]): AiTaskContext[] {
  return tasks
    .map((task) => ({
      title: String(task.title || task.name || '未命名任务'),
      status: String(task.status || 'todo'),
      dueAt: String(task.dueAt || task.due_date || task.due_at || ''),
      notes: String(task.notes || task.description || ''),
      source: task.source ? String(task.source) : undefined,
    }))
    .sort((a, b) => priority(a) - priority(b) || a.dueAt.localeCompare(b.dueAt))
    .slice(0, 12)
}
