import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapClientRecord, serializeClientInput } from './client-mapper'
import type { ClientInput } from './types'

export const clientKeys = { all: ['business', 'clients'] as const }

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('clients')
          .select('*')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapClientRecord)
      }
      return (
        await pb.collection('clients').getFullList({ sort: '-updated' })
      ).map(mapClientRecord)
    },
  })
}

function useClientMutation(action: 'create' | 'update' | 'delete') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: ClientInput | { id: string; input: ClientInput } | string
    ) => {
      if (action === 'delete') {
        if (getDataProvider() === 'supabase') {
          const { error } = await getSupabaseClient()
            .from('clients')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', payload as string)
          if (error) throw error
          return
        }
        await pb.collection('clients').delete(payload as string)
        return
      }
      const data =
        action === 'create'
          ? serializeClientInput(payload as ClientInput)
          : serializeClientInput(
              (payload as { id: string; input: ClientInput }).input
            )
      if (getDataProvider() === 'supabase') {
        const table = getSupabaseClient().from('clients')
        if (action === 'create') {
          const { error } = await table.insert(data)
          if (error) throw error
        } else {
          const { error } = await table
            .update(data)
            .eq('id', (payload as { id: string }).id)
          if (error) throw error
        }
        return
      }
      if (action === 'create') await pb.collection('clients').create(data)
      else await pb.collection('clients').update((payload as { id: string }).id, data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      toast.success(action === 'delete' ? '客户已删除' : '客户资料已保存')
    },
    onError: () => toast.error('客户操作失败'),
  })
}

export const useCreateClient = () => useClientMutation('create')
export const useUpdateClient = () => useClientMutation('update')
export const useDeleteClient = () => useClientMutation('delete')
