/**
 * 知识库/Dify 中台 API 客户端
 * 提供知识库检索（RAG）、文档同步、知识问答以及混合检索降级策略。
 */

export type DifyKnowledgeQuery = {
  query: string
  datasetId?: string
  topK?: number
  scoreThreshold?: number
}

export type DifyKnowledgeRecord = {
  id: string
  title: string
  content: string
  score: number
  metadata?: Record<string, unknown>
}

export type DifyConfig = {
  endpoint: string
  apiKey: string
  datasetId: string
  enabled: boolean
}

const DIFY_STORAGE_KEY = 'tk.dify.config'

export const DEFAULT_DIFY_CONFIG: DifyConfig = {
  endpoint: 'http://localhost/v1',
  apiKey: '',
  datasetId: '',
  enabled: false,
}

export function getDifyConfig(): DifyConfig {
  try {
    const raw = localStorage.getItem(DIFY_STORAGE_KEY)
    if (!raw) return DEFAULT_DIFY_CONFIG
    return { ...DEFAULT_DIFY_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_DIFY_CONFIG
  }
}

export function saveDifyConfig(config: Partial<DifyConfig>): void {
  const current = getDifyConfig()
  const updated = { ...current, ...config }
  localStorage.setItem(DIFY_STORAGE_KEY, JSON.stringify(updated))
}

/**
 * 知识库语义检索：优先请求 Dify 知识库接口，未配置或请求失败时平滑降级。
 */
export async function searchDifyKnowledge(
  params: DifyKnowledgeQuery
): Promise<DifyKnowledgeRecord[]> {
  const config = getDifyConfig()
  if (!config.enabled || !config.apiKey || !config.endpoint) {
    return []
  }

  const datasetId = params.datasetId || config.datasetId
  if (!datasetId) return []

  const url = `${config.endpoint.replace(/\/+$/, '')}/datasets/${datasetId}/retrieve`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        retrieval_model: {
          search_method: 'hybrid_search',
          reranking_enable: true,
          top_k: params.topK ?? 5,
          score_threshold: params.scoreThreshold ?? 0.5,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.warn('[Dify] 知识库检索异常:', res.status, res.statusText)
      return []
    }

    const data = await res.json() as { records?: Array<{ segment?: { id: string; content: string; document?: { name: string } }; score?: number }> }
    if (!data.records || !Array.isArray(data.records)) return []

    return data.records.map((r, idx) => ({
      id: r.segment?.id || `dify-record-${idx}`,
      title: r.segment?.document?.name || `知识片段 ${idx + 1}`,
      content: r.segment?.content || '',
      score: r.score ?? 0,
    }))
  } catch (err) {
    console.warn('[Dify] 检索请求失败或超时:', err)
    return []
  } finally {
    clearTimeout(timeout)
  }
}
