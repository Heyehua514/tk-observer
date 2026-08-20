/**
 * 市场选品库 CRUD mutation（Supabase-first，PocketBase 回退）。
 * 金额以分存储；录入用元，入库换算成最小单位。
 * 所属工作台：市场（韩素云）。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { productCatalogKeys } from './use-product-catalog'

export type ProductInput = {
  name: string
  category: string
  priceYuan: string
  costYuan: string
  currency: 'CNY' | 'USD'
  region: string
  status: string
}

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: productCatalogKeys.all })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const payload = {
        name: input.name,
        category: input.category,
        price_minor: Math.round(Number(input.priceYuan || 0) * 100),
        cost_minor: Math.round(Number(input.costYuan || 0) * 100),
        currency: input.currency,
        region: input.region,
        status: input.status,
      }
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('products')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        return data
      }
      return pb.collection('products').create(payload)
    },
    onSuccess: () => {
      invalidate(qc)
      toast.success('商品已新增')
    },
    onError: () => toast.error('新增失败，请检查输入'),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProductInput }) => {
      const payload = {
        name: input.name,
        category: input.category,
        price_minor: Math.round(Number(input.priceYuan || 0) * 100),
        cost_minor: Math.round(Number(input.costYuan || 0) * 100),
        currency: input.currency,
        region: input.region,
        status: input.status,
      }
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('products')
          .update(payload)
          .eq('id', id)
          .select('id')
          .single()
        if (error) throw error
        return data
      }
      return pb.collection('products').update(id, payload)
    },
    onSuccess: () => {
      invalidate(qc)
      toast.success('商品已更新')
    },
    onError: () => toast.error('更新失败，请重试'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('products')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        return id
      }
      await pb.collection('products').delete(id)
      return id
    },
    onSuccess: () => {
      invalidate(qc)
      toast.success('商品已删除')
    },
    onError: () => toast.error('删除失败'),
  })
}
