/**
 * 视频任务状态机与排期流转核心模型。
 * 覆盖状态：todo (待处理) -> editing (制作中) -> review (待审核) -> done (已完成)。
 * 规则：
 * 1. 状态在合法状态集内推进或回退。
 * 2. 状态推至 done 时，支持自动构建关联发布排期的数据载荷。
 */
import type {
  PublishPlatform,
  PublishScheduleInput,
  VideoAccount,
} from './types'

export const VIDEO_TASK_STATUSES = ['todo', 'editing', 'review', 'done'] as const
export type VideoTaskStatus = (typeof VIDEO_TASK_STATUSES)[number]

export const videoTaskStatusLabels: Record<VideoTaskStatus, string> = {
  todo: '待处理',
  editing: '制作中',
  review: '待审核',
  done: '已完成',
}

const NEXT_STATUS_MAP: Record<VideoTaskStatus, VideoTaskStatus | null> = {
  todo: 'editing',
  editing: 'review',
  review: 'done',
  done: null,
}

const PREV_STATUS_MAP: Record<VideoTaskStatus, VideoTaskStatus | null> = {
  todo: null,
  editing: 'todo',
  review: 'editing',
  done: 'review',
}

export function isKnownVideoTaskStatus(
  status: string
): status is VideoTaskStatus {
  return (VIDEO_TASK_STATUSES as readonly string[]).includes(status)
}

export function getVideoTaskStatusLabel(status: string): string {
  if (isKnownVideoTaskStatus(status)) {
    return videoTaskStatusLabels[status]
  }
  return status || '待处理'
}

export function getNextTaskStatus(status: string): VideoTaskStatus | null {
  if (!isKnownVideoTaskStatus(status)) return 'editing'
  return NEXT_STATUS_MAP[status]
}

export function getPrevTaskStatus(status: string): VideoTaskStatus | null {
  if (!isKnownVideoTaskStatus(status)) return null
  return PREV_STATUS_MAP[status]
}

export function canTransitionTaskStatus(from: string, to: string): boolean {
  if (!isKnownVideoTaskStatus(from) || !isKnownVideoTaskStatus(to)) return false
  if (from === to) return true
  if (NEXT_STATUS_MAP[from] === to) return true
  if (PREV_STATUS_MAP[from] === to) return true
  if (to === 'done') return true
  return false
}

export type AutoScheduleTaskSource = {
  id: string
  title: string
  region?: string
  dueAt?: string
  account?: VideoAccount
  platform?: PublishPlatform
}

export function buildAutoSchedulePayload(
  task: AutoScheduleTaskSource
): PublishScheduleInput {
  const safeTitle = (task.title || '').trim() || '未命名视频任务'
  const fallbackDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const scheduledTime = task.dueAt
    ? task.dueAt.includes('T')
      ? task.dueAt
      : `${task.dueAt}T10:00:00+08:00`
    : fallbackDate.toISOString()

  return {
    videoId: '',
    videoTaskId: task.id,
    title: safeTitle,
    account: task.account ?? '跨境TK磊哥',
    platform: task.platform ?? '微信视频号',
    region: task.region || 'US',
    publishAt: scheduledTime,
    status: 'scheduled',
    notes: `由视频任务【${safeTitle}】制作完成自动转入排期流转`,
  }
}