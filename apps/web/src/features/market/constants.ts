/** 市场工作台子模块标识。 */
export const marketTabs = [
  'products',
  'competitors',
  'ads',
  'calendar',
] as const
export const eventTypes = [
  'closed_salon',
  'private_dinner',
  'annual_summit',
  'global_study_tour',
] as const
export const eventTypeLabels = {
  closed_salon: '闭门沙龙',
  private_dinner: '私董饭局',
  annual_summit: '年度峰会',
  global_study_tour: '全球游学',
} as const
export const eventStatuses = [
  'preparing',
  'sponsoring',
  'scheduled',
  'ongoing',
  'ended',
  'reviewed',
] as const
export const eventStatusLabels = {
  preparing: '筹备中',
  sponsoring: '招商中',
  scheduled: '已定档',
  ongoing: '进行中',
  ended: '已结束',
  reviewed: '已复盘',
} as const
export const venueTypes = [
  'hotel',
  'club',
  'industrial_park',
  'creative_space',
  'study_destination',
] as const
export const venueTypeLabels = {
  hotel: '五星酒店',
  club: '高端会所',
  industrial_park: '产业园区',
  creative_space: '创意空间',
  study_destination: '游学目的地',
} as const
