import type { AiMemory } from './hooks/use-ai-memory'

/** 只在本地排序已通过 RLS 返回的记忆，不扩大数据读取范围。 */
export function rankAiMemories(
  memories: AiMemory[],
  scope: string,
  taskType: string
): AiMemory[] {
  const prefix = `${scope}:`
  return memories
    .filter(
      (item) =>
        item.memoryKey.includes(taskType) || item.memoryKey.startsWith(prefix)
    )
    .slice()
    .sort((a, b) => {
      const aScope = a.memoryKey.startsWith(prefix) ? 1 : 0
      const bScope = b.memoryKey.startsWith(prefix) ? 1 : 0
      if (aScope !== bScope) return bScope - aScope
      if (a.confidence !== b.confidence) return b.confidence - a.confidence
      return (b.lastUsedAt || '').localeCompare(a.lastUsedAt || '')
    })
    .slice(0, 8)
}
