/** 市场工作台竞品监测类型；权限：market、boss 只读，business/editing 维护原表。 */
export type MarketCompetitorAccount = {
  id: string
  name: string
  platform: string
  category: string
  profileUrl: string
  followerCount: number
  averageViews: number
  notes: string
  updated: string
}
