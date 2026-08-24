/** 剪辑工作台 Supabase 映射层。只负责表行到现有前端模型的转换。 */
import type { Database } from '@/types/database.generated'
import {
  buildVideoArchiveItems,
  buildPublishScheduleItems,
  buildVideoTaskItems,
} from '../components/production-model'
import type {
  CompetitorAccount,
  CompetitorStyleAnalysis,
  CompetitorVideo,
  ImportHistory,
  MetricSnapshot,
  PublishScheduleInput,
  RankedViralFeature,
  TrendingTopic,
  VideoIdea,
  VideoIdeaAccountAnalytics,
  VideoIdeaInput,
  VideoIdeaTypeAnalytics,
} from '../types'

type PublicDb = Database['public']['Tables']

type VideoTaskRow = PublicDb['video_tasks']['Row']
type VideoArchiveRow = PublicDb['videos']['Row']
type PublishScheduleRow = PublicDb['publish_schedules']['Row']
type PublishScheduleInsert = PublicDb['publish_schedules']['Insert']
type PublishScheduleUpdate = PublicDb['publish_schedules']['Update']
type VideoIdeaRow = PublicDb['video_ideas']['Row']
type ImportHistoryRow = PublicDb['import_history']['Row']
type CompetitorAccountRow = PublicDb['competitor_accounts']['Row']
type CompetitorVideoRow = PublicDb['competitor_videos']['Row']
type TrendingTopicRow = PublicDb['trending_topics']['Row']
type CompetitorStyleAnalysisRow = PublicDb['competitor_style_analysis']['Row']
type VideoIdeaSummaryRow =
  Database['public']['Views']['video_idea_summary']['Row']
type VideoIdeaAccountStatsRow =
  Database['public']['Views']['video_idea_account_stats']['Row'] & {
    likes?: number | null
    comments?: number | null
    follower_gain?: number | null
  }
type VideoIdeaTypeStatsRow =
  Database['public']['Views']['video_idea_type_stats']['Row']
type VideoIdeaViralFeatureRow =
  Database['public']['Views']['video_idea_viral_features']['Row']
type PartialRecord<T> = Partial<T> & Record<string, unknown>

const dateOnly = (value: unknown) => String(value || '').slice(0, 10)

export function mapSupabaseVideoTaskRecord(
  record: PartialRecord<VideoTaskRow>
) {
  return buildVideoTaskItems([
    {
      id: String(record.id || ''),
      title: String(record.title || ''),
      productName: String(record.product_name || ''),
      creatorName: String(record.creator_name || ''),
      status: String(record.status || ''),
      dueAt: String(record.due_at || ''),
      owner: String(record.owner_name || ''),
    },
  ])[0]
}

export function mapSupabaseVideoArchiveRecord(
  record: PartialRecord<VideoArchiveRow>
) {
  return buildVideoArchiveItems([
    {
      id: String(record.id || ''),
      title: String(record.title || ''),
      productName: String(record.product_name || ''),
      creatorName: String(record.creator_name || ''),
      publishAt: String(record.publish_at || ''),
      fileUrl: String(record.file_path || ''),
    },
  ])[0]
}

export function mapSupabasePublishScheduleRecord(
  record: PartialRecord<PublishScheduleRow>
) {
  return buildPublishScheduleItems([
    {
      id: String(record.id || ''),
      title: String(record.title || ''),
      account: String(record.account || ''),
      platform: String(record.platform || ''),
      region: String(record.region || ''),
      publishAt: String(record.publish_at || ''),
      status: String(record.status || ''),
    },
  ])[0]
}

export function serializeSupabasePublishSchedule(
  input: PublishScheduleInput
): PublishScheduleInsert {
  return {
    video_id: input.videoId || null,
    video_task_id: input.videoTaskId || null,
    title: input.title,
    account: input.account,
    region: input.region,
    platform: input.platform,
    publish_at: input.publishAt,
    status: input.status,
    notes: input.notes || null,
  }
}

export function buildSupabasePublishScheduleUpdate(
  input: Partial<PublishScheduleInput>
): PublishScheduleUpdate {
  const payload: PublishScheduleUpdate = {}
  if (input.videoId !== undefined) payload.video_id = input.videoId || null
  if (input.videoTaskId !== undefined)
    payload.video_task_id = input.videoTaskId || null
  if (input.title !== undefined) payload.title = input.title
  if (input.account !== undefined) payload.account = input.account
  if (input.region !== undefined) payload.region = input.region
  if (input.platform !== undefined) payload.platform = input.platform
  if (input.publishAt !== undefined) payload.publish_at = input.publishAt
  if (input.status !== undefined) payload.status = input.status
  if (input.notes !== undefined) payload.notes = input.notes || null
  return payload
}

export function mapSupabaseVideoIdeaRecord(
  record: PartialRecord<VideoIdeaRow>
): VideoIdea {
  return {
    id: String(record.id || ''),
    account: record.account as VideoIdea['account'],
    videoType: record.video_type as VideoIdea['videoType'],
    title: String(record.title || ''),
    description: String(record.description || ''),
    sourceUrl: String(record.source_url || ''),
    tags: String(record.tags || ''),
    publishDate: dateOnly(record.publish_date),
    views: Number(record.views || 0),
    likes: Number(record.likes || 0),
    comments: Number(record.comments || 0),
    shares: Number(record.shares || 0),
    completionRate: Number(record.completion_rate || 0),
    followerGain: Number(record.follower_gain || 0),
    isViral: Boolean(record.is_viral),
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function serializeSupabaseVideoIdea(input: VideoIdeaInput) {
  return {
    account: input.account,
    video_type: input.videoType,
    title: input.title,
    description: input.description || null,
    source_url: input.sourceUrl || null,
    tags: input.tags || null,
    publish_date: `${input.publishDate} 00:00:00.000Z`,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    completion_rate: input.completionRate,
    follower_gain: input.followerGain,
  }
}

export function toSupabaseVideoIdeaSort(sort: string) {
  const column = sort.replace(/^-/, '')
  const direction = sort.startsWith('-') ? 'desc' : 'asc'
  return `${column}.${direction}`
}

export function mapSupabaseImportHistory(
  record: PartialRecord<ImportHistoryRow>
): ImportHistory {
  return {
    id: String(record.id || ''),
    importedAt: String(record.imported_at || ''),
    fileName: String(record.file_name || ''),
    totalRows: Number(record.total_rows || 0),
    newCount: Number(record.new_count || 0),
    updatedCount: Number(record.updated_count || 0),
    snapshot: {
      totalVideos: Number(
        (record.snapshot as { totalVideos?: number })?.totalVideos || 0
      ),
      monthlyNew: Number(
        (record.snapshot as { monthlyNew?: number })?.monthlyNew || 0
      ),
      viralCount: Number(
        (record.snapshot as { viralCount?: number })?.viralCount || 0
      ),
      viralRate: Number(
        (record.snapshot as { viralRate?: number })?.viralRate || 0
      ),
      averageCompletionRate: Number(
        (record.snapshot as { averageCompletionRate?: number })
          ?.averageCompletionRate || 0
      ),
      averageViews: Number(
        (record.snapshot as { averageViews?: number })?.averageViews || 0
      ),
      totalFollowerGain: Number(
        (record.snapshot as { totalFollowerGain?: number })
          ?.totalFollowerGain || 0
      ),
    },
    created: String(record.created_at || ''),
  }
}

export function mapSupabaseCompetitorAccount(
  record: PartialRecord<CompetitorAccountRow>
): CompetitorAccount {
  return {
    id: String(record.id || ''),
    name: String(record.name || ''),
    platform: String(record.platform || ''),
    profileUrl: String(record.profile_url || ''),
    category: String(record.category || ''),
    followerCount: Number(record.follower_count || 0),
    averageViews: Number(record.avg_views || 0),
    notes: String(record.notes || ''),
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function mapSupabaseCompetitorVideo(
  record: PartialRecord<CompetitorVideoRow>
): CompetitorVideo {
  return {
    id: String(record.id || ''),
    competitorId: String(record.competitor_id || ''),
    title: String(record.title || ''),
    url: String(record.url || ''),
    publishDate: dateOnly(record.publish_date),
    views: Number(record.views || 0),
    likes: Number(record.likes || 0),
    contentTags: String(record.content_tags || ''),
    whyViral: String(record.why_viral || ''),
    referenceTo: String(record.reference_to || ''),
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function mapSupabaseTrendingTopic(
  record: PartialRecord<TrendingTopicRow>
): TrendingTopic {
  return {
    id: String(record.id || ''),
    topic: String(record.topic || ''),
    source: String(record.source || ''),
    keywords: String(record.keywords || ''),
    heatLevel: record.heat_level as TrendingTopic['heatLevel'],
    insight: String(record.insight || ''),
    referenceUrl: String(record.reference_url || ''),
    discoveredAt: dateOnly(record.discovered_at),
    convertedToIdea: Boolean(record.converted_to_idea),
    created: String(record.created_at || ''),
    updated: String(record.updated_at || ''),
  }
}

export function mapSupabaseStyleAnalysis(
  record: PartialRecord<CompetitorStyleAnalysisRow>
): CompetitorStyleAnalysis {
  return {
    id: String(record.id || ''),
    competitorId: String(record.competitor_id || ''),
    contentStyle: String(record.content_style || ''),
    titlePattern: String(record.title_pattern || ''),
    hookMethod: String(record.hook_method || ''),
    editingStyle: String(record.editing_style || ''),
    viralFactors: String(record.viral_factors || ''),
    applicableToUs: String(record.applicable_to_us || ''),
    analyzedAt: dateOnly(record.analyzed_at),
    created: String(record.created_at || ''),
  }
}

export function mapSupabaseVideoIdeaSummary(
  record: PartialRecord<VideoIdeaSummaryRow>
): MetricSnapshot {
  return {
    totalVideos: Number(record.total_videos || 0),
    monthlyNew: Number(record.monthly_new || 0),
    viralCount: Number(record.viral_count || 0),
    viralRate: Number(record.viral_rate || 0),
    averageCompletionRate: Number(record.average_completion_rate || 0),
    averageViews: Number(record.average_views || 0),
    totalFollowerGain: Number(record.total_follower_gain || 0),
  }
}

export function mapSupabaseVideoIdeaAccountAnalytics(
  record: PartialRecord<VideoIdeaAccountStatsRow>
): VideoIdeaAccountAnalytics {
  return {
    account: record.account as VideoIdeaAccountAnalytics['account'],
    views: Number(record.views || 0),
    averageCompletionRate: Number(record.average_completion_rate || 0),
    likes: Number(record.likes || 0),
    comments: Number(record.comments || 0),
    followerGain: Number(record.follower_gain || 0),
    viralCount: Number(record.viral_count || 0),
  }
}

export function mapSupabaseVideoIdeaTypeAnalytics(
  record: PartialRecord<VideoIdeaTypeStatsRow>
): VideoIdeaTypeAnalytics {
  return {
    videoType: record.video_type as VideoIdeaTypeAnalytics['videoType'],
    averageCompletionRate: Number(record.average_completion_rate || 0),
  }
}

export function mapSupabaseRankedViralFeature(
  record: PartialRecord<VideoIdeaViralFeatureRow>
): RankedViralFeature {
  return {
    value: String(record.value || ''),
    count: Number(record.count || 0),
  }
}
