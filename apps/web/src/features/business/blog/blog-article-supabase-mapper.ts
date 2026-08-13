/** 商务公众号文章 Supabase 字段映射；权限：business、boss 只读展示。 */
import type { BlogArticle } from './types'

export type SupabaseBlogArticleRow = {
  id: string
  title?: unknown
  account?: unknown
  publish_date?: unknown
  views?: unknown
  likes?: unknown
  shares?: unknown
  is_viral?: unknown
  analysis_notes?: unknown
  source_url?: unknown
}

export function mapSupabaseBlogArticle(
  record: SupabaseBlogArticleRow
): BlogArticle {
  return {
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
  }
}
