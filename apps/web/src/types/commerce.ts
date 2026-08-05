/** 跨工作台通用的跨境电商站点类型与常量。 */
export const regions = ['US', 'UK', 'ID', 'TH', 'VN', 'MY', 'PH', 'SG'] as const

export type Region = (typeof regions)[number]
