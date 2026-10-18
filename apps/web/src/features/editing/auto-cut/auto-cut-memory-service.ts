/**
 * 智能切片反思与企业记忆回流服务
 * 封装 ai_memory 与 failed_cases 双写沉淀，严格遵循字段长度与数据库契约约束。
 */
import type { VideoDeepDiagnosis } from './auto-cut-model'

export interface MemorySavePayload {
  memoryType: string
  memoryKey: string
  memoryValue: string
  confidence: number
  source: string
}

export interface FailedCasePayload {
  source_type: string
  source_id: string
  reason: string
  lessons: string
  recorded_at: string
}

export function buildAutoCutMemoryPayload(diagnosis: VideoDeepDiagnosis): MemorySavePayload {
  const topic = diagnosis.hotNewsRelevance?.industryTopic || '未命名对标'
  const summary = diagnosis.learnedExperienceSummary || ''
  const hooks = diagnosis.viralDNA?.hookPatterns?.length
    ? diagnosis.viralDNA.hookPatterns.join('、')
    : '无'

  return {
    memoryType: 'video_cut_style',
    memoryKey: `对标拆解:${topic.slice(0, 30)}`,
    memoryValue: `${summary} | 黄金钩子:${hooks}`.slice(0, 2000),
    confidence: 0.9,
    source: 'auto_cut_diagnosis',
  }
}

export function buildFailedCasePayload(
  diagnosis: VideoDeepDiagnosis,
  recordedAt = new Date().toISOString()
): FailedCasePayload {
  const rawSource = (diagnosis.sourceNameOrUrl || '未命名素材').trim()
  // source_id 严格收口在 80 字符以内，防止越界
  const sourceId = rawSource.slice(0, 80)
  const summary = (diagnosis.learnedExperienceSummary || '').slice(0, 500)
  const tone = diagnosis.overallPersona?.toneStyle || '无'
  const painPoints = diagnosis.viralDNA?.corePainPoints?.length
    ? diagnosis.viralDNA.corePainPoints.join('、')
    : '无'
  const lessons = `人设画像: ${tone}；痛点: ${painPoints}`.slice(0, 2000)

  return {
    source_type: '剪辑',
    source_id: sourceId,
    reason: `【对标学习】${summary}`,
    lessons,
    recorded_at: recordedAt,
  }
}

export async function persistAutoCutReflection({
  diagnosis,
  saveMemory,
  supabaseClient,
}: {
  diagnosis: VideoDeepDiagnosis
  saveMemory: (item: MemorySavePayload) => Promise<unknown>
  supabaseClient?: {
    from: (table: string) => {
      insert: (record: Record<string, unknown>) => Promise<{ error: unknown | null }>
    }
  }
}) {
  const memoryPayload = buildAutoCutMemoryPayload(diagnosis)
  await saveMemory(memoryPayload)

  if (supabaseClient) {
    const casePayload = buildFailedCasePayload(diagnosis)
    const { error } = await supabaseClient.from('failed_cases').insert(casePayload as unknown as Record<string, unknown>)
    if (error) {
      console.warn('Failed to insert failed_cases:', error)
    }
  }

  return { memoryPayload }
}
