/** 剪辑工作台生产数据模型：视频任务与成片归档展示。 */
export type VideoTaskItem = {
  id: string
  title: string
  subtitle: string
  status: string
  dueAt: string
  owner: string
}

export type VideoArchiveItem = {
  id: string
  title: string
  subtitle: string
  publishAt: string
  fileUrl: string
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
