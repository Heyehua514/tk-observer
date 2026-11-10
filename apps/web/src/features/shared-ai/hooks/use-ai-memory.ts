/** 当前用户 AI 记忆；只保存用户确认内容，Supabase-first。 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import {
  type AiMemoryInput,
  loadAiMemories,
  removeAiMemory,
  saveAiMemory,
} from '../ai-memory-service'

export type { AiMemory } from '../ai-memory-service'
const key = (ownerId: string) => ['ai-memory', ownerId] as const

export function useAiMemory() {
  const ownerId = useAuthStore((state) => state.user?.id || '')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: key(ownerId),
    enabled: Boolean(ownerId),
    queryFn: () => loadAiMemories(ownerId),
  })
  const save = useMutation({
    mutationFn: (memory: AiMemoryInput) => saveAiMemory(ownerId, memory),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => removeAiMemory(ownerId, id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: key(ownerId) }),
  })
  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isSaving: save.isPending,
    isRemoving: remove.isPending,
    isError: query.isError,
    refetch: query.refetch,
    save: save.mutateAsync,
    remove: remove.mutateAsync,
  }
}
