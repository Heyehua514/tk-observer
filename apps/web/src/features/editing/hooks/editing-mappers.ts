/** PocketBase 剪辑工作台记录与前端领域类型的统一映射入口。 */
import type { RecordModel } from 'pocketbase'
import type {
  CompetitorAccount,
  CompetitorStyleAnalysis,
  CompetitorVideo,
  ImportHistory,
  MetricSnapshot,
  RankedViralFeature,
  TrendingTopic,
  VideoIdea,
  VideoIdeaAccountAnalytics,
  VideoIdeaInput,
  VideoIdeaTypeAnalytics,
} from '../types'

function dateOnly(value: unknown) {
  return String(value || '').slice(0, 10)
}

function metricSnapshot(value: unknown): MetricSnapshot {
  const data = value && typeof value === 'object' ? value : {}
  const snapshot = data as Partial<MetricSnapshot>
  return {
    totalVideos: Number(snapshot.totalVideos || 0),
    monthlyNew: Number(snapshot.monthlyNew || 0),
    viralCount: Number(snapshot.viralCount || 0),
    viralRate: Number(snapshot.viralRate || 0),
    averageCompletionRate: Number(snapshot.averageCompletionRate || 0),
    averageViews: Number(snapshot.averageViews || 0),
    totalFollowerGain: Number(snapshot.totalFollowerGain || 0),
  }
}

export function mapVideoIdeaSummary(record: RecordModel): MetricSnapshot {
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

export function mapVideoIdeaAccountAnalytics(
  record: RecordModel
): VideoIdeaAccountAnalytics {
  return {
    account: record.account as VideoIdeaAccountAnalytics['account'],
    views: Number(record.views || 0),
    averageCompletionRate: Number(record.average_completion_rate || 0),
    viralCount: Number(record.viral_count || 0),
  }
}

export function mapVideoIdeaTypeAnalytics(
  record: RecordModel
): VideoIdeaTypeAnalytics {
  return {
    videoType: record.video_type as VideoIdeaTypeAnalytics['videoType'],
    averageCompletionRate: Number(record.average_completion_rate || 0),
  }
}

export function mapRankedViralFeature(record: RecordModel): RankedViralFeature {
  return {
    value: String(record.value || ''),
    count: Number(record.count || 0),
  }
}

export function mapVideoIdea(record: RecordModel): VideoIdea {
  return {
    id: record.id,
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
    created: String(record.created || ''),
    updated: String(record.updated || ''),
  }
}

export function serializeVideoIdea(input: VideoIdeaInput) {
  return {
    account: input.account,
    video_type: input.videoType,
    title: input.title,
    description: input.description,
    source_url: input.sourceUrl || null,
    tags: input.tags,
    publish_date: `${input.publishDate} 00:00:00.000Z`,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    completion_rate: input.completionRate,
    follower_gain: input.followerGain,
  }
}

export function mapImportHistory(record: RecordModel): ImportHistory {
  return {
    id: record.id,
    importedAt: String(record.imported_at || ''),
    fileName: String(record.file_name || ''),
    totalRows: Number(record.total_rows || 0),
    newCount: Number(record.new_count || 0),
    updatedCount: Number(record.updated_count || 0),
    snapshot: metricSnapshot(record.snapshot),
    created: String(record.created || ''),
  }
}

export function mapCompetitorAccount(record: RecordModel): CompetitorAccount {
  return {
    id: record.id,
    name: String(record.name || ''),
    platform: String(record.platform || ''),
    profileUrl: String(record.profile_url || ''),
    category: String(record.category || ''),
    followerCount: Number(record.follower_count || 0),
    averageViews: Number(record.avg_views || 0),
    notes: String(record.notes || ''),
    created: String(record.created || ''),
    updated: String(record.updated || ''),
  }
}

export function mapCompetitorVideo(record: RecordModel): CompetitorVideo {
  return {
    id: record.id,
    competitorId: String(record.competitor || ''),
    title: String(record.title || ''),
    url: String(record.url || ''),
    publishDate: dateOnly(record.publish_date),
    views: Number(record.views || 0),
    likes: Number(record.likes || 0),
    contentTags: String(record.content_tags || ''),
    whyViral: String(record.why_viral || ''),
    referenceTo: String(record.reference_to || ''),
    created: String(record.created || ''),
    updated: String(record.updated || ''),
  }
}

export function mapTrendingTopic(record: RecordModel): TrendingTopic {
  return {
    id: record.id,
    topic: String(record.topic || ''),
    source: String(record.source || ''),
    keywords: String(record.keywords || ''),
    heatLevel: record.heat_level as TrendingTopic['heatLevel'],
    insight: String(record.insight || ''),
    referenceUrl: String(record.reference_url || ''),
    discoveredAt: dateOnly(record.discovered_at),
    convertedToIdea: Boolean(record.converted_to_idea),
    created: String(record.created || ''),
    updated: String(record.updated || ''),
  }
}

export function mapStyleAnalysis(record: RecordModel): CompetitorStyleAnalysis {
  return {
    id: record.id,
    competitorId: String(record.competitor || ''),
    contentStyle: String(record.content_style || ''),
    titlePattern: String(record.title_pattern || ''),
    hookMethod: String(record.hook_method || ''),
    editingStyle: String(record.editing_style || ''),
    viralFactors: String(record.viral_factors || ''),
    applicableToUs: String(record.applicable_to_us || ''),
    analyzedAt: dateOnly(record.analyzed_at),
    created: String(record.created || ''),
  }
}
