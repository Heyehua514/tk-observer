import { beforeEach, expect, it, vi } from 'vitest'
import { useAiMemory } from './use-ai-memory'

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  load: vi.fn(),
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}))
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'owner-1' } }),
}))
vi.mock('../ai-memory-service', () => ({
  loadAiMemories: mocks.load,
  saveAiMemory: mocks.save,
  removeAiMemory: mocks.remove,
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useQuery.mockReturnValue({
    data: [],
    isLoading: false,
    isPending: true,
    isError: false,
  })
  mocks.useMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
})

it('keeps mutation pending separate from query pending', () => {
  expect(useAiMemory()).toMatchObject({
    isPending: true,
    isSaving: false,
    isRemoving: false,
  })
})

it('refreshes current owner memory after confirmed save and removal', async () => {
  useAiMemory()
  const saveOptions = mocks.useMutation.mock.calls[0][0]
  const removeOptions = mocks.useMutation.mock.calls[1][0]
  const input = {
    memoryType: 'accepted_ai',
    memoryKey: 'key',
    memoryValue: 'value',
    confidence: 0.7,
    source: 'accepted_ai',
  }
  await saveOptions.mutationFn(input)
  expect(mocks.save).toHaveBeenCalledWith('owner-1', input)
  await removeOptions.mutationFn('memory-1')
  expect(mocks.remove).toHaveBeenCalledWith('owner-1', 'memory-1')
  saveOptions.onSuccess()
  removeOptions.onSuccess()
  expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2)
  expect(mocks.invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['ai-memory', 'owner-1'],
  })
})
