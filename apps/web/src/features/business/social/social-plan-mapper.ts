/** 朋友圈计划数据库字段映射；兼容 Supabase/PocketBase。 */
export type SocialPlan = {
  id: string
  date: string
  content: string
  target: string
  status: string
}

export type SocialPlanDraft = {
  date: string
  content: string
  target_audience: string
  expected_outcome: string
}

export function mapSocialPlanRecord(record: Record<string, unknown>): SocialPlan {
  return {
    id: String(record.id || ''),
    date: String(record.date || ''),
    content: String(record.content || ''),
    target: String(record.target_audience || ''),
    status: String(record.status || ''),
  }
}

export function serializeSocialPlanDraft(draft: SocialPlanDraft) {
  return {
    ...draft,
    date: `${draft.date} 00:00:00.000Z`,
    status: 'planned',
  }
}
