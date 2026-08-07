/** 市场资源库类型：对应模板、活动物料和财务明细集合。 */
export type TemplateType =
  'invitation' | 'external_copy' | 'poster_copy' | 'review_report' | 'sop'

export type TemplateEventType =
  | 'closed_salon'
  | 'private_dinner'
  | 'annual_summit'
  | 'global_study_tour'
  | 'general'

export type EventTemplate = {
  id: string
  name: string
  type: TemplateType
  eventType: TemplateEventType
  content: string
  tags: string
  usageCount: number
  lastUsedAt: string
}

export type MaterialType =
  | 'key_visual'
  | 'poster'
  | 'invitation'
  | 'check_in'
  | 'table_card'
  | 'agenda'
  | 'thank_you'
export type MaterialStatus =
  'designing' | 'pending_review' | 'confirmed' | 'printed'
export type EventMaterial = {
  id: string
  eventId: string
  eventName: string
  type: MaterialType
  name: string
  file: string
  status: MaterialStatus
  notes: string
}

export type FinanceCategory =
  | 'sponsorship_income'
  | 'ticket_income'
  | 'venue'
  | 'setup'
  | 'catering'
  | 'printing'
  | 'travel'
  | 'other'
export type FinanceType = 'income' | 'expense'
export type EventFinance = {
  id: string
  eventId: string
  eventName: string
  category: FinanceCategory
  type: FinanceType
  amount: number
  description: string
  paidBy: string
  paidAt: string
}

export type EventOption = {
  id: string
  name: string
  city: string
  date: string
  theme: string
}
