import type { IntelligenceItem } from '@/features/intelligence/intelligence-model'

/** 从情报列表中筛选用于总览首屏展示的高价值摘要（最多 limit 条，默认 4 条） */
export function selectOverviewDigestItems(
  items: IntelligenceItem[],
  limit = 4
): IntelligenceItem[] {
  return items
    .filter((item) => item.status !== 'ignored')
    .slice(0, limit)
}
