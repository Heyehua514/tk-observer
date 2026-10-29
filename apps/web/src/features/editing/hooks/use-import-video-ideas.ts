/** CSV 导入 mutation：Supabase 由单次 RPC 原子写入，PocketBase 保留兼容回退。 */
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
  serializeSupabaseVideoIdea,
} from './editing-supabase-mappers'
import { importHistoryKeys } from './use-import-history'
import { videoIdeaKeys } from './use-video-ideas'
import { formatImportFeedback } from './video-idea-csv'

export type ImportVideoIdeasInput = {
  fileName: string
  rows: VideoIdeaInput[]
  totalRows?: number
  skippedCount?: number
  failureCount?: number
}

export function useImportVideoIdeas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fileName,
      rows,
      totalRows = rows.length,
      skippedCount = 0,
      failureCount = 0,
    }: ImportVideoIdeasInput) => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient().rpc(
          'import_video_ideas',
          {
            p_file_name: fileName,
            p_rows: rows.map(serializeSupabaseVideoIdea),
            p_total_rows: totalRows,
            p_skipped_count: skippedCount,
            p_failure_count: failureCount,
          }
        )
        if (error) throw error
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('导入完成但未返回历史记录')
        }
        const history = mapSupabaseImportHistory(
          data as Record<string, unknown>
        )
        return {
          history,
          newCount: history.newCount,
          updatedCount: history.updatedCount,
          skippedCount: history.skippedCount,
          failureCount: history.failureCount,
        }
      }

      let newCount = 0
      let updatedCount = 0
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
        if (existing) {
          await pb
            .collection('video_ideas')
            .update(existing.id, serializeVideoIdea(row))
          updatedCount += 1
        } else {
          await pb.collection('video_ideas').create(serializeVideoIdea(row))
          newCount += 1
        }
      }
      const summary = await pb
        .collection('video_idea_summary')
        .getOne('videoideasum001')
      const savedHistory = mapImportHistory(
        await pb.collection('import_history').create({
          imported_at: new Date().toISOString(),
          file_name: fileName,
          total_rows: totalRows,
          new_count: newCount,
          updated_count: updatedCount,
          snapshot: mapVideoIdeaSummary(summary),
        })
      )
      const history = {
        ...savedHistory,
        totalRows,
        skippedCount,
        failureCount,
      }
      return {
        history,
        newCount,
        updatedCount,
        skippedCount,
        failureCount,
      }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: videoIdeaKeys.all })
      void queryClient.invalidateQueries({ queryKey: importHistoryKeys.all })
      toast.success(formatImportFeedback(result))
    },
  })
}
