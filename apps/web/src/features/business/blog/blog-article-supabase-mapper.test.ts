/** 商务公众号文章 Supabase 映射自检；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import { mapSupabaseBlogArticle } from './blog-article-supabase-mapper'

describe('mapSupabaseBlogArticle', () => {
  it('maps Supabase blog article rows into the existing frontend model', () => {
    expect(
      mapSupabaseBlogArticle({
        id: 'article-1',
        title: 'TikTok 全域增长',
        account: 'TK观察',
        publish_date: '2026-08-13T00:00:00Z',
        views: 12000,
        likes: 300,
        shares: 80,
        is_viral: true,
        analysis_notes: '标题击中跨境卖家痛点',
        source_url: 'https://example.test/article',
      })
    ).toEqual({
      id: 'article-1',
      title: 'TikTok 全域增长',
      account: 'TK观察',
      publishDate: '2026-08-13T00:00:00Z',
      views: 12000,
      likes: 300,
      shares: 80,
      isViral: true,
      analysisNotes: '标题击中跨境卖家痛点',
      sourceUrl: 'https://example.test/article',
    })
  })
})
