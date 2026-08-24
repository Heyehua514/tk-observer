import type { AiNote } from './ai-notes-view'

export function filterAiNotes(
  notes: AiNote[],
  filters: { taskType: string; scope: string }
) {
  return notes.filter(
    (note) =>
      (!filters.taskType || note.taskType === filters.taskType) &&
      (!filters.scope || note.scope === filters.scope)
  )
}
