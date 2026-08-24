export const intelligenceSourceTypes = [
  'official',
  'rss',
  'authorized',
  'public',
  'manual',
  'csv',
] as const
export type IntelligenceSourceType = (typeof intelligenceSourceTypes)[number]
export const intelligenceStatuses = [
  'unread',
  'read',
  'saved',
  'ignored',
  'tasked',
] as const
export type IntelligenceStatus = (typeof intelligenceStatuses)[number]

export type IntelligenceItem = {
  id: string
  title: string
  summary: string
  sourceName: string
  sourceType: IntelligenceSourceType
  sourceUrl: string
  capturedAt: string
  region: string
  language: string
  topic: string
  heatScore: number
  confidence: number
  dedupeKey: string
  workspaces: string[]
  status: IntelligenceStatus
  createdBy: string
  createdAt: string
}

export type IntelligenceDraft = Pick<
  IntelligenceItem,
  | 'title'
  | 'summary'
  | 'sourceName'
  | 'sourceType'
  | 'sourceUrl'
  | 'capturedAt'
  | 'region'
  | 'language'
  | 'topic'
  | 'heatScore'
  | 'confidence'
  | 'dedupeKey'
  | 'workspaces'
>

export function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateIntelligenceDraft(
  draft: Partial<IntelligenceDraft>
): string[] {
  const errors: string[] = []
  if (!draft.title?.trim()) errors.push('标题不能为空')
  if (!draft.sourceName?.trim()) errors.push('来源不能为空')
  if (!draft.sourceUrl || !isSafeExternalUrl(draft.sourceUrl)) {
    errors.push('原文链接必须是 http 或 https 地址')
  }
  if (!draft.capturedAt?.trim()) errors.push('采集时间不能为空')
  if (!draft.dedupeKey?.trim()) errors.push('去重键不能为空')
  return errors
}

export type IntelligenceFilters = {
  query?: string
  workspace?: string
  status?: IntelligenceStatus | 'all'
}

export function filterIntelligenceItems(
  items: IntelligenceItem[],
  filters: IntelligenceFilters
) {
  const query = filters.query?.trim().toLocaleLowerCase('zh-CN') || ''
  return items.filter((item) => {
    const text = [item.title, item.summary, item.sourceName, item.topic]
      .join(' ')
      .toLocaleLowerCase('zh-CN')
    return (
      (!query || text.includes(query)) &&
      (!filters.workspace ||
        filters.workspace === 'all' ||
        item.workspaces.includes(filters.workspace)) &&
      (!filters.status || filters.status === 'all' || item.status === filters.status)
    )
  })
}
