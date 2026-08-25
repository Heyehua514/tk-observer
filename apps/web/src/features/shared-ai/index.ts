/** 通用 AI 助手统一导出。 */
export { AiAssistantPanel, type AiTaskType } from './ai-assistant-panel'
export {
  buildWorkspaceAiPrompt,
  normalizeAiWorkspaceItems,
  type AiWorkspaceItem,
} from './ai-workspace-context'
export { useAiWorkspaceContext } from './hooks/use-ai-workspace-context'
export { AiNotesView } from './ai-notes-view'
export { AiMemoryView } from './ai-memory-view'
export { TaskAiEntry } from './task-ai-entry'
export { rankAiMemories } from './ai-memory-ranking'
