/** 市场活动详情领域类型；权限：market、boss。 */
export type ActivityRelatedRecord = {
  id: string
  status?: string
  stage?: string
  type?: string
  amount?: number
  completionPct?: number
  title?: string
  name?: string
  company?: string
  position?: string
  category?: string
  description?: string
  notes?: string
}

export type ActivityMetrics = {
  taskTotal: number
  taskDone: number
  confirmedRegistrations: number
  signedSponsorship: number
  income: number
  expense: number
  profit: number
}
