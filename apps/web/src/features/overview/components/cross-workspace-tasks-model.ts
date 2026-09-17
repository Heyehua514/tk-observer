export type CrossWorkspaceTask = {
  id: string
  title: string
  workspace: 'design' | 'editing' | 'business'
  status: string
  dueAt?: string
  assigneeName?: string
}

export function isTaskOverdue(dueAt?: string, now = new Date()): boolean {
  if (!dueAt) return false
  const dueDate = new Date(dueAt)
  if (isNaN(dueDate.getTime())) return false
  return dueDate.getTime() < now.getTime()
}

export function filterPendingTasks(
  tasks: CrossWorkspaceTask[],
  now = new Date()
): {
  overdue: CrossWorkspaceTask[]
  dueSoon: CrossWorkspaceTask[]
  normal: CrossWorkspaceTask[]
} {
  const overdue: CrossWorkspaceTask[] = []
  const dueSoon: CrossWorkspaceTask[] = []
  const normal: CrossWorkspaceTask[] = []

  const soonThreshold = now.getTime() + 24 * 60 * 60 * 1000

  for (const t of tasks) {
    if (t.status === 'completed' || t.status === 'won' || t.status === 'done') {
      continue
    }
    if (!t.dueAt) {
      normal.push(t)
      continue
    }
    const dueTime = new Date(t.dueAt).getTime()
    if (isNaN(dueTime)) {
      normal.push(t)
    } else if (dueTime < now.getTime()) {
      overdue.push(t)
    } else if (dueTime <= soonThreshold) {
      dueSoon.push(t)
    } else {
      normal.push(t)
    }
  }

  return { overdue, dueSoon, normal }
}
