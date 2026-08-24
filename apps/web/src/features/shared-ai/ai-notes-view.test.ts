import { describe, expect, it } from 'vitest'
import { filterAiNotes } from './ai-notes-utils'
import type { AiNote } from './ai-notes-view'

const notes: AiNote[] = [
  { id: '1', scope: '市场', taskType: '调研', prompt: 'A', result: 'x', created: '' },
  { id: '2', scope: '剪辑', taskType: '选题', prompt: 'B', result: 'y', created: '' },
]

describe('filterAiNotes', () => {
  it('filters by type and source together', () => {
    expect(filterAiNotes(notes, { taskType: '调研', scope: '市场' })).toEqual([notes[0]])
  })
})
