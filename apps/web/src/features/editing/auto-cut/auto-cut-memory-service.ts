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
  supabaseClient?: unknown
}) {
  const memoryPayload = buildAutoCutMemoryPayload(diagnosis)
  await saveMemory(memoryPayload)

  if (supabaseClient && typeof supabaseClient === 'object' && 'from' in supabaseClient) {
    const casePayload = buildFailedCasePayload(diagnosis)
    try {
      const client = supabaseClient as {
        from: (table: string) => {
          insert: (record: unknown) => PromiseLike<{ error: unknown | null }>
        }
      }
      const res = await client.from('failed_cases').insert(casePayload)
      if (res && res.error) {
        console.warn('Failed to insert failed_cases:', res.error)
      }
    } catch (err) {
      console.warn('Error persisting failed_cases:', err)
    }
  }

  return { memoryPayload }
}
