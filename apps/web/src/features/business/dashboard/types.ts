/** 商务驾驶舱只读数据契约；权限沿用 business 与 boss。 */
import type { OpportunityStage } from '../opportunities'

export type DashboardClient = {
  id: string
  name: string
  created: string
  updated: string
}

export type DashboardOpportunity = {
  id: string
  clientName: string
  title: string
  amount: number
  stage: OpportunityStage
  probability: number
  expectedClose: string
  updated: string
}

export type DashboardOrder = {
  id: string
  title: string
  clientName: string
  amount: number
  status: string
  publishDate: string
  updated: string
}

export type DashboardSocialPlan = {
  id: string
  content: string
  date: string
  status: string
}

export type BusinessDashboardData = {
  clients: DashboardClient[]
  opportunities: DashboardOpportunity[]
  orders: DashboardOrder[]
  socialPlans: DashboardSocialPlan[]
}

export type DashboardAction = DashboardOpportunity & {
  urgency: 'overdue' | 'due_soon'
  daysUntilDue: number
}

export type BusinessDashboardSummary = BusinessDashboardData & {
  metrics: {
    totalClients: number
    newClientsThisMonth: number
    activeOpportunities: number
    activeOpportunityAmount: number
    publishedOrdersThisMonth: number
    comparison: null
  }
  actions: DashboardAction[]
  recentClients: DashboardClient[]
  recentOrders: DashboardOrder[]
  upcomingSocialPlans: DashboardSocialPlan[]
}
