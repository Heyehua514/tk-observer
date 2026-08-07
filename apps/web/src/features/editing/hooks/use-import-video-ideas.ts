/** CSV 导入 mutation：同标题同发布日期跳过，并写入 import_history 快照。 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import type { VideoIdeaInput } from '../types'
import {
  mapImportHistory,
  mapVideoIdeaSummary,
  serializeVideoIdea,
} from './editing-mappers'
import { videoIdeaKeys } from './use-video-ideas'

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
      toast.success(
        `导入完成：新增 ${result.newCount} 条，跳过 ${result.skippedCount} 条重复数据`
      )
    },
  })
}
