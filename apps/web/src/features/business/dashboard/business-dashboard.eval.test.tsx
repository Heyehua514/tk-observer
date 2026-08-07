import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { BusinessDashboardContent } from './business-dashboard'
import type { BusinessDashboardSummary } from './types'

const summary: BusinessDashboardSummary = {
  metrics: {
    totalClients: 12,
    newClientsThisMonth: 3,
    activeOpportunities: 2,
    activeOpportunityAmount: 200000,
    publishedOrdersThisMonth: 1,
    comparison: null,
  },
  clients: [],
  opportunities: [
    {
      id: 'o1',
      clientName: '远海品牌',
      title: 'Q3 渠道合作',
      amount: 120000,
      stage: 'proposal',
      probability: 30,
      expectedClose: '2026-08-05T08:00:00Z',
      updated: '2026-08-05T03:00:00Z',
    },
  ],
  orders: [],
  socialPlans: [],
  actions: [
    {
      id: 'o1',
      clientName: '远海品牌',
      title: 'Q3 渠道合作',
      amount: 120000,
      stage: 'proposal',
      probability: 30,
      expectedClose: '2026-08-05T08:00:00Z',
      updated: '2026-08-05T03:00:00Z',
      urgency: 'overdue',
      daysUntilDue: -1,
    },
  ],
  recentClients: [
    {
      id: 'c1',
      name: '远海品牌',
      created: '2026-08-01',
      updated: '2026-08-05',
    },
  ],
  recentOrders: [
    {
      id: 'r1',
      title: '新品测评',
      clientName: '远海品牌',
      amount: 36000,
      status: 'published',
      publishDate: '2026-08-08',
      updated: '2026-08-05',
    },
  ],
  upcomingSocialPlans: [
    {
      id: 's1',
      content: '品牌增长案例',
      date: '2026-08-07',
      status: 'planned',
    },
  ],
}

it('presents the operating loop and opens the opportunity workflow from an action', async () => {
  const onNavigate = vi.fn()
  const screen = await render(
    <BusinessDashboardContent summary={summary} onNavigate={onNavigate} />
  )

  for (const label of [
    '总客户数',
    '本月新增客户',
    '进行中商机',
    '预计成交金额',
    '本月已发商单',
  ]) {
    await expect.element(screen.getByText(label)).toBeInTheDocument()
  }
  for (const stage of [
    '初步接洽',
    '方案报价',
    '商务谈判',
    '合同签署',
    '已成交',
    '已流失',
  ]) {
    await expect.element(screen.getByText(stage)).toBeInTheDocument()
  }
  await expect.element(screen.getByText('已逾期 1 天')).toBeInTheDocument()
  await expect.element(screen.getByText('新品测评')).toBeInTheDocument()
  await expect.element(screen.getByText('品牌增长案例')).toBeInTheDocument()

  await userEvent.click(
    screen.getByRole('button', { name: '处理 Q3 渠道合作' })
  )
  expect(onNavigate).toHaveBeenCalledWith('opportunities')
})
