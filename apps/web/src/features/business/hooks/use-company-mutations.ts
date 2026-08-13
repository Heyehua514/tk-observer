import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CompanyInput } from '../types'
import { mapCompany, serializeCompany } from './company-mapper'
import {
  mapSupabaseCompany,
  serializeSupabaseCompany,
} from './company-supabase-mapper'
import { companyKeys } from './use-companies'

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompanyInput) => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('companies')
          .insert(serializeSupabaseCompany(input))
          .select('*')
          .single()
        if (error) throw error
        return mapSupabaseCompany(data)
      }
      return mapCompany(
        await pb.collection('companies').create(serializeCompany(input))
      )
    },
    onSuccess: (company) => {
      recordAudit('新增合作公司', 'companies', company.id)
      void queryClient.invalidateQueries({ queryKey: companyKeys.all })
      toast.success('公司已新增')
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CompanyInput }) => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('companies')
          .update(serializeSupabaseCompany(input))
          .eq('id', id)
          .select('*')
          .single()
        if (error) throw error
        return mapSupabaseCompany(data)
      }
      return mapCompany(
        await pb.collection('companies').update(id, serializeCompany(input))
      )
    },
    onSuccess: (company) => {
      recordAudit('更新合作公司', 'companies', company.id)
      void queryClient.invalidateQueries({ queryKey: companyKeys.all })
      toast.success('公司资料已更新')
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('companies')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        return id
      }
      await pb.collection('companies').delete(id)
      return id
    },
    onSuccess: (id) => {
      recordAudit('删除合作公司', 'companies', id)
      void queryClient.invalidateQueries({ queryKey: companyKeys.all })
      toast.success('公司已删除')
    },
  })
}
