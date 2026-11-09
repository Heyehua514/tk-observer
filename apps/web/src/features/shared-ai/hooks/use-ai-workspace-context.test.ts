import { describe, expect, it } from 'vitest'
import { createAiWorkspaceContextLoader } from './use-ai-workspace-context'

describe('AI workspace context loader', () => {
  it('returns bounded Supabase summaries and reports failed sources', async () => {
    const load = createAiWorkspaceContextLoader(
      '剪辑工作台',
      async (source) => {
        if (source === '视频任务') throw new Error('denied')
        if (source === '热点') return []
        return [
          {
            title: '爆款选题',
            status: '待分析',
            dueAt: '2026-08-26',
            metric: '播放 120000',
          },
        ]
      }
    )

    await expect(load()).resolves.toMatchObject({
      available: true,
      items: [expect.objectContaining({ kind: '选题', title: '爆款选题' })],
      missingSources: ['视频任务'],
    })
  })

  it('aborts stalled source queries and continues with available context', async () => {
    const load = createAiWorkspaceContextLoader(
      '剪辑工作台',
      async (source, _definition, signal) => {
        if (source === '热点') return []
        if (source === '视频任务') {
          return new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(new Error('aborted')))
          })
        }
        return [{ title: '爆款选题', status: '待分析' }]
      },
      5
    )

    await expect(load()).resolves.toMatchObject({
      available: true,
      missingSources: ['视频任务'],
      items: [expect.objectContaining({ title: '爆款选题' })],
    })
  })

  it('continues when a stalled adapter ignores cancellation', async () => {
    const load = createAiWorkspaceContextLoader(
      '剪辑工作台',
      async (source) => {
        if (source === '视频任务') return new Promise(() => {})
        return []
      },
      5
    )
    await expect(load()).resolves.toEqual({
      available: true,
      items: [],
      missingSources: ['视频任务'],
    })
  })
})
