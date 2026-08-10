/** 公众号分析数据；权限：business、boss。 */
export const blogAccounts = [
  'TK观察',
  '霞光社',
  '白鲸出海',
  '晚点财经',
] as const
export type BlogAccount = (typeof blogAccounts)[number]

export type BlogArticle = {
  id: string
  title: string
  account: BlogAccount
  publishDate: string
  views: number
  likes: number
  shares: number
  isViral: boolean
  analysisNotes: string
  sourceUrl: string
}
