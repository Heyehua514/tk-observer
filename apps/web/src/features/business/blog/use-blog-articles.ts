/** 商务工作台公众号文章查询；Supabase-first，PocketBase 保留回退。 */
import { useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { mapSupabaseBlogArticle } from './blog-article-supabase-mapper'
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
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('blog_articles')
          .select('*')
          .is('deleted_at', null)
          .order('publish_date', { ascending: false })
        if (error) throw error
        return (data || []).map(mapSupabaseBlogArticle)
      }
      return (
        await pb
          .collection('blog_articles')
          .getFullList({ sort: '-publish_date' })
      ).map(mapArticle)
    },
  })
}
