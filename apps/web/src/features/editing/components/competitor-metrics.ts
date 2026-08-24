export function formatMetric(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value >= 10000)
    return `${(value / 10000).toFixed(1).replace(/\.0$/u, '')}万`
  return Math.round(value).toLocaleString('zh-CN')
}

export function getEngagementRate(views: number, likes: number) {
  if (!Number.isFinite(views) || views <= 0 || !Number.isFinite(likes)) return 0
  return Math.round((Math.max(likes, 0) / views) * 1000) / 10
}

export function getTrafficLabel(views: number, averageViews: number) {
  if (
    !Number.isFinite(views) ||
    !Number.isFinite(averageViews) ||
    averageViews <= 0
  ) {
    return '暂无基线'
  }
  if (views > averageViews * 1.1) return '高于均播'
  if (views < averageViews * 0.9) return '低于均播'
  return '接近均播'
}
