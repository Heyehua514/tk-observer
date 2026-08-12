/** 爆款选题列表查询：分页、模糊搜索、组合筛选、排序与实时刷新。 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { createSupabasePageQuery } from '@/lib/supabase-table'
import type { VideoIdeaListParams, VideoIdeaListResult } from '../types'
import {
  mapSupabaseVideoIdeaRecord,
  toSupabaseVideoIdeaSort,
} from './editing-supabase-mappers'
import { mapVideoIdea } from './editing-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const videoIdeaKeys = {
  all: ['video-ideas'] as const,
  list: (params: VideoIdeaListParams) =>
    [...videoIdeaKeys.all, 'list', params] as const,
  detail: (id: string) => [...videoIdeaKeys.all, 'detail', id] as const,
  analytics: () => [...videoIdeaKeys.all, 'analytics'] as const,
}

export function buildVideoIdeaFilter(params: VideoIdeaListParams) {
  const filters: string[] = []
  const values: Record<string, string> = {}
  if (params.query) {
    filters.push(
      '(title ~ {:query} || description ~ {:query} || tags ~ {:query})'
    )
    values.query = params.query
  }
  if (params.account !== 'all') {
    filters.push('account = {:account}')
    values.account = params.account
  }
  if (params.videoType !== 'all') {
    filters.push('video_type = {:videoType}')
    values.videoType = params.videoType
  }
  if (params.tag) {
    filters.push('tags ~ {:tag}')
    values.tag = params.tag
  }
  if (params.dateFrom) {
    filters.push('publish_date >= {:dateFrom}')
    values.dateFrom = `${params.dateFrom} 00:00:00.000Z`
  }
  if (params.dateTo) {
    filters.push('publish_date <= {:dateTo}')
    values.dateTo = `${params.dateTo} 23:59:59.999Z`
  }
  if (params.viral !== 'all') {
    filters.push('is_viral = {:viral}')
    values.viral = params.viral === 'viral' ? 'true' : 'false'
  }
  return filters.length ? pb.filter(filters.join(' && '), values) : ''
}

async function fetchVideoIdeas(
  params: VideoIdeaListParams
): Promise<VideoIdeaListResult> {
  if (getDataProvider() === 'supabase') {
    const filters: Parameters<typeof createSupabasePageQuery>[0]['filters'] = []
    const query = params.query.trim()
    if (query) {
      const escaped = query.replace(/%/g, '\\%').replace(/,/g, '\\,')
      filters.push({
        kind: 'or',
        expression: `title.ilike.%${escaped}%,description.ilike.%${escaped}%,tags.ilike.%${escaped}%`,
      })
    }
    if (params.account !== 'all') {
      filters.push({ kind: 'eq', column: 'account', value: params.account })
    }
    if (params.videoType !== 'all') {
      filters.push({
        kind: 'eq',
        column: 'video_type',
        value: params.videoType,
      })
    }
    if (params.tag) {
      const escaped = params.tag.replace(/%/g, '\\%').replace(/,/g, '\\,')
      filters.push({ kind: 'or', expression: `tags.ilike.%${escaped}%` })
    }
    if (params.dateFrom) {
      filters.push({
        kind: 'gte',
        column: 'publish_date',
        value: `${params.dateFrom} 00:00:00.000Z`,
      })
    }
    if (params.dateTo) {
      filters.push({
        kind: 'lte',
        column: 'publish_date',
        value: `${params.dateTo} 23:59:59.999Z`,
      })
    }
    if (params.viral !== 'all') {
      filters.push({ kind: 'eq', column: 'is_viral', value: params.viral === 'viral' })
    }
    return createSupabasePageQuery({
      table: 'video_ideas',
      page: params.page,
      perPage: params.perPage,
      sort: toSupabaseVideoIdeaSort(params.sort),
      filters,
      mapRow: mapSupabaseVideoIdeaRecord,
    })
  }
  const page = await pb
    .collection('video_ideas')
    .getList(params.page, params.perPage, {
      filter: buildVideoIdeaFilter(params),
      sort: params.sort,
    })
  return { ...page, items: page.items.map(mapVideoIdea) }
}

export function useVideoIdeas(params: VideoIdeaListParams) {
  useEditingRealtime('video_ideas', videoIdeaKeys.all)
  return useQuery({
    queryKey: videoIdeaKeys.list(params),
    queryFn: () => fetchVideoIdeas(params),
    placeholderData: keepPreviousData,
  })
}

export async function fetchVideoIdeasForExport(params: VideoIdeaListParams) {
  if (getDataProvider() === 'supabase') {
    const result = await fetchVideoIdeas({ ...params, page: 1, perPage: 500 })
    return (
      result.items
    )
  }
  const records = await pb.collection('video_ideas').getFullList({
    filter: buildVideoIdeaFilter(params),
    sort: params.sort,
  })
  return records.map(mapVideoIdea)
}
