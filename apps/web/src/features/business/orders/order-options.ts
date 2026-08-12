/** 商务工作台渠道商单枚举；与 channel_orders 表 select 字段保持同步。 */
export const orderStatusOptions = [
  ['negotiating', '洽谈中'],
  ['confirmed', '已确认'],
  ['filming', '拍摄中'],
  ['published', '已发布'],
  ['completed', '已完成'],
  ['cancelled', '已取消'],
] as const

export const orderPlatformOptions = [
  ['tiktok', 'TikTok'],
  ['wechat_channels', '视频号'],
  ['douyin', '抖音'],
  ['youtube', 'YouTube'],
] as const

export const orderContentTypeOptions = [
  ['spoken_placement', '口播植入'],
  ['unboxing', '开箱测评'],
  ['story_placement', '剧情植入'],
  ['live_commerce', '直播带货'],
  ['other', '其他'],
] as const

export const orderStatusLabels = Object.fromEntries(orderStatusOptions)
export const orderPlatformLabels = Object.fromEntries(orderPlatformOptions)
export const orderContentTypeLabels = Object.fromEntries(orderContentTypeOptions)
