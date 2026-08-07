import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import type { Client, ClientInput } from './types'

export const clientKeys = { all: ['business', 'clients'] as const }

const mapClient = (record: RecordModel): Client => ({
  id: record.id,
  name: String(record.name || ''),
  contactName: String(record.contact_name || ''),
  contactPhone: String(record.contact_phone || ''),
  contactWechat: String(record.contact_wechat || ''),
  company: String(record.company || ''),
  industry: String(record.industry || 'other'),
  source: String(record.source || 'other'),
  level: (record.level || 'C') as Client['level'],
  notes: String(record.notes || ''),
  updated: String(record.updated || ''),
})

const serialize = (input: ClientInput) => ({
  name: input.name,
  contact_name: input.contactName,
  contact_phone: input.contactPhone,
  contact_wechat: input.contactWechat,
  company: input.company,
  industry: input.industry,
  source: input.source,
  level: input.level,
  notes: input.notes,
})

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: async () =>
      (await pb.collection('clients').getFullList({ sort: '-updated' })).map(
        mapClient
      ),
  })
}

function useClientMutation(action: 'create' | 'update' | 'delete') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: ClientInput | { id: string; input: ClientInput } | string
    ) => {
      if (action === 'delete') {
        await pb.collection('clients').delete(payload as string)
        return
      }
      const data =
        action === 'create'
          ? serialize(payload as ClientInput)
          : serialize((payload as { id: string; input: ClientInput }).input)
      if (action === 'create') await pb.collection('clients').create(data)
      else
        await pb
          .collection('clients')
          .update((payload as { id: string }).id, data)
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
