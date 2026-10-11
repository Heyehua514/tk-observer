/** 剪辑工作台生产数据模型：视频任务、成片归档与回流指标展示。 */
import type { VideoMetrics } from '../video-metrics-model'

export type VideoTaskItem = {
  id: string
  title: string
  subtitle: string
  status: string
  dueAt: string
  owner: string
}

export type VideoArchiveItem = Partial<VideoMetrics> & {
  id: string
  title: string
  subtitle: string
  publishAt: string
  fileUrl: string
  views: number
  likes: number
  comments: number
  shares: number
  completionRate: number
  conversionGmvCents: number
  orderCount: number
  externalUrl?: string
}

export type PublishScheduleItem = {
  id: string
  title: string
  subtitle: string
  account: string
  platform: string
  publishAt: string
  status: string
}

export const publishScheduleStatusLabels: Record<string, string> = {
  scheduled: '已排期',
  publishing: '发布中',
  published: '已发布',
  failed: '发布失败',
  cancelled: '已取消',
}

type VideoTaskRecord = {
  id: string
  title: string
  productName: string
  creatorName: string
  status: string
  dueAt: string
  owner: string
}

type VideoArchiveRecord = {
  id: string
  title: string
  productName: string
  creatorName: string
  publishAt: string
  fileUrl: string
  views?: number
  likes?: number
  comments?: number
  shares?: number
  completionRate?: number
  conversionGmvCents?: number
  orderCount?: number
  externalUrl?: string
}

type PublishScheduleRecord = {
  id: string
  title: string
  account: string
  platform: string
  region: string
  publishAt: string
  status: string
}

const dateOnly = (value: string) => String(value || '').slice(0, 10)

export function buildVideoTaskItems(
  records: VideoTaskRecord[]
): VideoTaskItem[] {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    subtitle: [record.productName, record.creatorName]
      .filter(Boolean)
      .join(' · '),
    status: record.status,
    dueAt: dateOnly(record.dueAt),
    owner: record.owner,
  }))
}

export function buildVideoArchiveItems(
  records: VideoArchiveRecord[]
): VideoArchiveItem[] {
  return records
    .slice()
    .sort((left, right) => right.publishAt.localeCompare(left.publishAt))
    .map((record) => ({
      id: record.id,
      title: record.title,
      subtitle: [record.productName, record.creatorName]
        .filter(Boolean)
        .join(' · '),
      publishAt: dateOnly(record.publishAt),
      fileUrl: record.fileUrl,
      views: Number(record.views || 0),
      likes: Number(record.likes || 0),
      comments: Number(record.comments || 0),
      shares: Number(record.shares || 0),
      completionRate: Number(record.completionRate || 0),
      conversionGmvCents: Number(record.conversionGmvCents || 0),
      orderCount: Number(record.orderCount || 0),
      externalUrl: record.externalUrl ? String(record.externalUrl) : undefined,
    }))
}

export function buildPublishScheduleItems(
  records: PublishScheduleRecord[]
): PublishScheduleItem[] {
  return records
    .slice()
    .sort((left, right) => right.publishAt.localeCompare(left.publishAt))
    .map((record) => ({
      id: record.id,
      title: record.title,
      subtitle: [record.platform, record.region].filter(Boolean).join(' · '),
      account: record.account,
      platform: record.platform,
      publishAt: dateOnly(record.publishAt),
      status: record.status,
    }))
}
