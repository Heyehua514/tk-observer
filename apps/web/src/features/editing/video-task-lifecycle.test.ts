import { describe, expect, it } from 'vitest'
import {
  buildAutoSchedulePayload,
  canTransitionTaskStatus,
  getNextTaskStatus,
  getPrevTaskStatus,
  getVideoTaskStatusLabel,
  isKnownVideoTaskStatus,
} from './video-task-lifecycle'
import {
  buildVideoArchiveItems,
  buildVideoTaskItems,
} from './components/production-model'
import { serializeVideoArchiveInput } from './components/video-archive-upload'

describe('video task lifecycle & status machine', () => {
  it('identifies known video task statuses and renders human labels', () => {
    expect(isKnownVideoTaskStatus('todo')).toBe(true)
    expect(isKnownVideoTaskStatus('editing')).toBe(true)
    expect(isKnownVideoTaskStatus('review')).toBe(true)
    expect(isKnownVideoTaskStatus('done')).toBe(true)
    expect(isKnownVideoTaskStatus('cancelled')).toBe(false)

    expect(getVideoTaskStatusLabel('todo')).toBe('待处理')
    expect(getVideoTaskStatusLabel('editing')).toBe('制作中')
    expect(getVideoTaskStatusLabel('review')).toBe('待审核')
    expect(getVideoTaskStatusLabel('done')).toBe('已完成')
    expect(getVideoTaskStatusLabel('custom_unknown')).toBe('custom_unknown')
  })

  it('computes next and previous status transitions along the pipeline', () => {
    expect(getNextTaskStatus('todo')).toBe('editing')
    expect(getNextTaskStatus('editing')).toBe('review')
    expect(getNextTaskStatus('review')).toBe('done')
    expect(getNextTaskStatus('done')).toBeNull()

    expect(getPrevTaskStatus('todo')).toBeNull()
    expect(getPrevTaskStatus('editing')).toBe('todo')
    expect(getPrevTaskStatus('review')).toBe('editing')
    expect(getPrevTaskStatus('done')).toBe('review')
  })

  it('validates transition boundaries allowing stepwise flow and direct completion', () => {
    expect(canTransitionTaskStatus('todo', 'editing')).toBe(true)
    expect(canTransitionTaskStatus('editing', 'review')).toBe(true)
    expect(canTransitionTaskStatus('review', 'done')).toBe(true)

    // Direct completion from any active phase is allowed
    expect(canTransitionTaskStatus('todo', 'done')).toBe(true)
    expect(canTransitionTaskStatus('editing', 'done')).toBe(true)

    // Single step rollback allowed
    expect(canTransitionTaskStatus('review', 'editing')).toBe(true)
    expect(canTransitionTaskStatus('editing', 'todo')).toBe(true)

    // Invalid transitions
    expect(canTransitionTaskStatus('todo', 'review')).toBe(false)
    expect(canTransitionTaskStatus('done', 'todo')).toBe(false)
    expect(canTransitionTaskStatus('unknown', 'editing')).toBe(false)
  })

  it('builds auto-schedule payload with default account and formatted target date', () => {
    const payload = buildAutoSchedulePayload({
      id: 'task-101',
      title: '东南亚爆品带货切片',
      region: 'TH',
      dueAt: '2026-10-20',
    })

    expect(payload).toMatchObject({
      videoTaskId: 'task-101',
      title: '东南亚爆品带货切片',
      account: '跨境TK磊哥',
      platform: '微信视频号',
      region: 'TH',
      publishAt: '2026-10-20T10:00:00+08:00',
      status: 'scheduled',
    })
    expect(payload.notes).toContain('东南亚爆品带货切片')
  })

  it('handles fallback default date and blank title defensively when building auto-schedule payload', () => {
    const payload = buildAutoSchedulePayload({
      id: 'task-102',
      title: '',
    })

    expect(payload.title).toBe('未命名视频任务')
    expect(payload.region).toBe('US')
    expect(typeof payload.publishAt).toBe('string')
    expect(payload.status).toBe('scheduled')
  })
})

describe('video archive integration with tasks', () => {
  it('serializes archive input with optional videoTaskId correctly', () => {
    const serializedWithTask = serializeVideoArchiveInput(
      {
        title: '成片 1',
        region: 'US',
        publishAt: '2026-10-15',
        productName: '商品 A',
        creatorName: '达人 B',
        videoTaskId: 'task-999',
      },
      'videos/file.mp4'
    )
    expect(serializedWithTask.video_task_id).toBe('task-999')

    const serializedWithoutTask = serializeVideoArchiveInput(
      {
        title: '成片 2',
        region: 'US',
        publishAt: '',
        productName: '',
        creatorName: '',
      },
      'videos/file2.mp4'
    )
    expect(serializedWithoutTask.video_task_id).toBeNull()
  })

  it('preserves videoTaskId and task metadata in production domain model', () => {
    const tasks = buildVideoTaskItems([
      {
        id: 'task-1',
        title: '任务标题',
        productName: '美妆个护',
        creatorName: '磊哥',
        status: 'editing',
        dueAt: '2026-10-18',
        owner: '谢洁',
        region: 'UK',
      },
    ])
    expect(tasks[0]).toMatchObject({
      id: 'task-1',
      region: 'UK',
      productName: '美妆个护',
      creatorName: '磊哥',
    })

    const archive = buildVideoArchiveItems([
      {
        id: 'video-1',
        title: '归档成片',
        productName: '美妆个护',
        creatorName: '磊哥',
        publishAt: '2026-10-18',
        fileUrl: 'path.mp4',
        videoTaskId: 'task-1',
      },
    ])
    expect(archive[0].videoTaskId).toBe('task-1')
  })
})