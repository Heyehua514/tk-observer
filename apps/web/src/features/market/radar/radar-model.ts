/** 爆品雷达数据处理、多维筛选、热度评估与导入导出模型 */
import type { ProductRadarFilterParams, ProductRadarItem, SourcePlatform } from './types'

export const RADAR_CATEGORIES = [
  '美妆个护',
  '女装时尚',
  '家居生活',
  '3C数码',
  '运动户外',
  '母婴玩具',
  '食品饮料',
  '汽车用品',
] as const

export const SOURCE_PLATFORM_LABELS: Record<SourcePlatform, string> = {
  tiktok_shop: 'TikTok Shop',
  amazon: '亚马逊 Amazon',
  shopee: 'Shopee',
  lazada: 'Lazada',
  other: '其他渠道',
}

/** 爆品热度等级分层与视觉提示 */
export function getRadarHeatGrade(heatScore: number): {
  level: 'explosive' | 'hot' | 'warm' | 'normal'
  label: string
  color: string
} {
  if (heatScore >= 85) {
    return { level: 'explosive', label: '超级爆款', color: 'text-rose-500' }
  }
  if (heatScore >= 70) {
    return { level: 'hot', label: '高热上升', color: 'text-amber-500' }
  }
  if (heatScore >= 50) {
    return { level: 'warm', label: '潜力起量', color: 'text-blue-500' }
  }
  return { level: 'normal', label: '平稳观察', color: 'text-muted-foreground' }
}

/** 过滤与排序雷达商品列表 */
export function filterAndSortRadarItems(
  items: ProductRadarItem[],
  params: ProductRadarFilterParams
): ProductRadarItem[] {
  return items
    .filter((item) => {
      // 关键字匹配
      if (params.query) {
        const queryLower = params.query.toLowerCase().trim()
        const matchesTitle = item.title.toLowerCase().includes(queryLower)
        const matchesCategory = item.category.toLowerCase().includes(queryLower)
        const matchesNotes = item.notes.toLowerCase().includes(queryLower)
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(queryLower))
        if (!matchesTitle && !matchesCategory && !matchesNotes && !matchesTag) {
          return false
        }
      }

      // 站点/地区过滤
      if (params.region && params.region !== 'all' && item.region !== params.region) {
        return false
      }

      // 类目过滤
      if (params.category && params.category !== 'all' && item.category !== params.category) {
        return false
      }

      // 渠道平台过滤
      if (params.sourcePlatform && params.sourcePlatform !== 'all' && item.sourcePlatform !== params.sourcePlatform) {
        return false
      }

      // 最低热度过滤
      if (typeof params.minHeatScore === 'number' && item.heatScore < params.minHeatScore) {
        return false
      }

      // 标签多选包含过滤
      if (params.tags && params.tags.length > 0) {
        const hasTag = params.tags.some((tag) => item.tags.includes(tag))
        if (!hasTag) return false
      }

      return true
    })
    .sort((a, b) => {
      const field = params.sortField || 'heatScore'
      const direction = params.sortDirection === 'asc' ? 1 : -1
      const valA = a[field]
      const valB = b[field]
      if (valA < valB) return -1 * direction
      if (valA > valB) return 1 * direction
      return 0
    })
}

/** 导出为 CSV 文本内容 */
export function exportRadarItemsToCsv(items: ProductRadarItem[]): string {
  const headers = [
    '"ID"',
    '"商品名称"',
    '"品类"',
    '"站点"',
    '"平台"',
    '"销量"',
    '"销售额(原币)"',
    '"币种"',
    '"热度评分"',
    '"7日增长率(%)"',
    '"标签"',
    '"已入选品库"',
    '"来源链接"',
    '"备注"',
  ]
  const rows = items.map((item) => [
    `"${item.id}"`,
    `"${item.title.replace(/"/g, '""')}"`,
    `"${item.category}"`,
    `"${item.region}"`,
    `"${SOURCE_PLATFORM_LABELS[item.sourcePlatform] || item.sourcePlatform}"`,
    item.salesVolume,
    (item.salesAmountMinor / 100).toFixed(2),
    item.currency,
    item.heatScore,
    item.growthRate,
    `"${item.tags.join(';')}"`,
    item.isAddedToProducts ? '是' : '否',
    `"${(item.sourceUrl || '').replace(/"/g, '""')}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ])

  // 添加 UTF-8 BOM 以保证 Excel 打开不乱码
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/** 导出为格式化 JSON 文本内容 */
export function exportRadarItemsToJson(items: ProductRadarItem[]): string {
  return JSON.stringify(items, null, 2)
}
