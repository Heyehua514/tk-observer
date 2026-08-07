/** 商务工作台公众号文章查询；只读展示，爆款标记由 PocketBase Hook 计算。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { pb } from '@/lib/pocketbase'
import type { BlogArticle } from './types'

export const blogArticleKeys = { all: ['business', 'blog-articles'] as const }

const mapArticle = (record: RecordModel): BlogArticle => ({
  id: record.id,
  title: String(record.title || ''),
  account: String(record.account || 'TK观察') as BlogArticle['account'],
  publishDate: String(record.publish_date || ''),
  views: Number(record.views || 0),
  likes: Number(record.likes || 0),
  shares: Number(record.shares || 0),
  isViral: Boolean(record.is_viral),
  analysisNotes: String(record.analysis_notes || ''),
  sourceUrl: String(record.source_url || ''),
})

export function useBlogArticles() {
  return useQuery({
    queryKey: blogArticleKeys.all,
    queryFn: async () =>
      (await pb.collection('blog_articles').getFullList({ sort: '-publish_date' })).map(
        mapArticle,
      ),
  })
}
