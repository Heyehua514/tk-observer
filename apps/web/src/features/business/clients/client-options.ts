/** 商务工作台客户枚举选项；与 clients 表 select 字段保持追加式同步。 */
export const clientIndustryOptions = [
  ['tiktok_service', 'TikTok服务商'],
  ['brand', '品牌方'],
  ['mcn', 'MCN'],
  ['supply_chain', '供应链'],
  ['ad_agency', '广告代理'],
  ['other', '其他'],
  ['ai_tool', 'AI工具服务商'],
  ['creator_tool', '达人建联工具'],
  ['erp', 'ERP系统'],
  ['payment', '支付服务商'],
  ['finance_tax', '财税服务商'],
] as const

export const clientSourceOptions = [
  ['social', '朋友圈获客'],
  ['referral', '老客户转介绍'],
  ['event', '活动获客'],
  ['outbound', '主动开发'],
  ['other', '其他'],
] as const

export const clientIndustryLabels = Object.fromEntries(clientIndustryOptions)
export const clientSourceLabels = Object.fromEntries(clientSourceOptions)
