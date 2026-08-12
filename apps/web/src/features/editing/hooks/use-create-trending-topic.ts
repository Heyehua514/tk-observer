/** 热点话题新增与“转为选题”状态 mutation。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { TrendingTopicInput } from '../types'
import { mapTrendingTopic } from './editing-mappers'
import { mapSupabaseTrendingTopic } from './editing-supabase-mappers'
import { trendingTopicKeys } from './use-trending-topics'

export function useCreateTrendingTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TrendingTopicInput) => {
      const payload = {
        topic: input.topic,
        source: input.source,
        keywords: input.keywords,
        heat_level: input.heatLevel,
        insight: input.insight,
        reference_url: input.referenceUrl || null,
        discovered_at: `${input.discoveredAt} 00:00:00.000Z`,
      }
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('trending_topics')
          .insert(payload)
          .select('*')
          .single()
        if (error) throw error
        return mapSupabaseTrendingTopic(data)
      }
      return mapTrendingTopic(
        await pb.collection('trending_topics').create({
          topic: input.topic,
          source: input.source,
          keywords: input.keywords,
          heat_level: input.heatLevel,
          insight: input.insight,
          reference_url: input.referenceUrl || null,
          discovered_at: `${input.discoveredAt} 00:00:00.000Z`,
        })
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trendingTopicKeys.all })
      toast.success('热点话题已保存')
    },
  })
}

export function useMarkTrendingTopicConverted() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('trending_topics')
          .update({ converted_to_idea: true })
          .eq('id', id)
        if (error) throw error
        return id
      }
      await pb
        .collection('trending_topics')
        .update(id, { converted_to_idea: true })
      return id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trendingTopicKeys.all })
    },
  })
}
