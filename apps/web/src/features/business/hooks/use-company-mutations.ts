import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordAudit } from '@/lib/audit'
import { pb } from '@/lib/pocketbase'
import type { CompanyInput } from '../types'
import { mapCompany, serializeCompany } from './company-mapper'
import { companyKeys } from './use-companies'

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompanyInput) =>
      mapCompany(
        await pb.collection('companies').create(serializeCompany(input))
      ),
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
    mutationFn: async ({ id, input }: { id: string; input: CompanyInput }) =>
      mapCompany(
        await pb.collection('companies').update(id, serializeCompany(input))
      ),
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
