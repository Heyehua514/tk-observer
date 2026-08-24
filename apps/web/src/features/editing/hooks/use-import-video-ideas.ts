/** CSV 导入 mutation：同标题同发布日期跳过，并写入 import_history 快照。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { VideoIdeaInput } from '../types'
import {
  mapImportHistory,
  mapVideoIdeaSummary,
  serializeVideoIdea,
} from './editing-mappers'
import {
  mapSupabaseImportHistory,
  mapSupabaseVideoIdeaSummary,
  serializeSupabaseVideoIdea,
} from './editing-supabase-mappers'
import { videoIdeaKeys } from './use-video-ideas'
import { formatImportFeedback } from './video-idea-csv'

export function useImportVideoIdeas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fileName,
      rows,
    }: {
      fileName: string
      rows: VideoIdeaInput[]
    }) => {
      if (getDataProvider() === 'supabase') {
        const supabase = getSupabaseClient()
        let newCount = 0
        for (const row of rows) {
          const { data: existing, error: existingError } = await supabase
            .from('video_ideas')
            .select('id')
            .eq('title', row.title)
            .gte('publish_date', `${row.publishDate} 00:00:00.000Z`)
            .lte('publish_date', `${row.publishDate} 23:59:59.999Z`)
            .maybeSingle()
          if (existingError) throw existingError
          if (existing) continue
          const { error } = await supabase
            .from('video_ideas')
            .insert(serializeSupabaseVideoIdea(row))
          if (error) throw error
          newCount += 1
        }
        const summaryResult = await supabase
          .from('video_idea_summary')
          .select('*')
          .maybeSingle()
        if (summaryResult.error) throw summaryResult.error
        const historyResult = await supabase
          .from('import_history')
          .insert({
            imported_at: new Date().toISOString(),
            file_name: fileName,
            total_rows: rows.length,
            new_count: newCount,
            updated_count: 0,
            snapshot: summaryResult.data
              ? mapSupabaseVideoIdeaSummary(summaryResult.data)
              : mapSupabaseVideoIdeaSummary({
                  total_videos: 0,
                  monthly_new: 0,
                  viral_count: 0,
                  viral_rate: 0,
                  average_completion_rate: 0,
                  average_views: 0,
                  total_follower_gain: 0,
                }),
          })
          .select('*')
          .single()
        if (historyResult.error) throw historyResult.error
        const history = mapSupabaseImportHistory(historyResult.data)
        return { history, newCount, skippedCount: rows.length - newCount }
      }
      let newCount = 0
      for (const row of rows) {
        const existing = await pb
          .collection('video_ideas')
          .getFirstListItem(
            pb.filter(
              'title = {:title} && publish_date >= {:dateFrom} && publish_date <= {:dateTo}',
              {
                title: row.title,
                dateFrom: `${row.publishDate} 00:00:00.000Z`,
                dateTo: `${row.publishDate} 23:59:59.999Z`,
              }
            )
          )
          .catch(() => null)
        if (existing) continue
        await pb.collection('video_ideas').create(serializeVideoIdea(row))
        newCount += 1
      }
      const summary = await pb
        .collection('video_idea_summary')
        .getOne('videoideasum001')
      const snapshot = mapVideoIdeaSummary(summary)
      const history = mapImportHistory(
        await pb.collection('import_history').create({
          imported_at: new Date().toISOString(),
          file_name: fileName,
          total_rows: rows.length,
          new_count: newCount,
          updated_count: 0,
          snapshot,
        })
      )
      return { history, newCount, skippedCount: rows.length - newCount }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: videoIdeaKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['import-history'] })
      toast.success(formatImportFeedback(result))
    },
  })
}
