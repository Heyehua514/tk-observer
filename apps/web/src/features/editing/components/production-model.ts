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
