/** 剪辑工作台领域类型：微信视频号选题、对标、热点与导入分析。 */
import type { ListResult } from 'pocketbase'

export type VideoAccount = '跨境TK磊哥' | 'TK观察磊哥' | '磊哥出海笔记'

export type VideoType =
  | '口播'
  | '专访预热'
  | '专访正片'
  | '专访花絮'
  | '快问快答'
  | '茶话会'
  | '饭局交流'
  | '饭局感受'

export type EditingSection = 'ideas' | 'competitors' | 'trends' | 'production'
export type IdeaTab = 'list' | 'analytics'
export type ViralFilter = 'all' | 'viral' | 'normal'
export type VideoIdeaSort = '-views' | '-completion_rate' | '-follower_gain'

export type VideoIdea = {
  id: string
  videoAccountId?: string
  externalVideoId?: string
  syncSource?: string
  lastSyncedAt?: string
  account: VideoAccount
  videoType: VideoType
  title: string
  description: string
  sourceUrl: string
  tags: string
  publishDate: string
  views: number
  likes: number
  comments: number
  shares: number
  completionRate: number
  followerGain: number
  isViral: boolean
  created: string
  updated: string
}

export type VideoIdeaInput = Omit<
  VideoIdea,
  'id' | 'isViral' | 'created' | 'updated'
>

export type VideoIdeaListParams = {
  page: number
  perPage: number
  query: string
  account: VideoAccount | 'all'
  videoType: VideoType | 'all'
  tag: string
  dateFrom: string
  dateTo: string
  viral: ViralFilter
  sort: VideoIdeaSort
}

export type VideoIdeaListResult = Omit<ListResult<VideoIdea>, 'items'> & {
  items: VideoIdea[]
}

export type PublishScheduleStatus =
  'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'

export type PublishPlatform = '微信视频号' | 'TikTok' | '抖音' | 'YouTube'

export type PublishSchedule = {
  id: string
  videoId: string
  videoTaskId: string
  title: string
  account: VideoAccount
  region: string
  platform: PublishPlatform
  publishAt: string
  status: PublishScheduleStatus
  notes: string
  created: string
  updated: string
}

export type PublishScheduleInput = Omit<
  PublishSchedule,
  'id' | 'created' | 'updated'
>

export type VideoArchiveInput = {
  title: string
  region: string
  publishAt: string
  productName: string
  creatorName: string
  file: File
}

export type MetricSnapshot = {
  totalVideos: number
  monthlyNew: number
  viralCount: number
  viralRate: number
  averageCompletionRate: number
  averageViews: number
  totalFollowerGain: number
}

export type VideoIdeaAccountAnalytics = {
  account: VideoAccount
  views: number
  averageCompletionRate: number
  likes: number
  comments: number
  followerGain: number
  viralCount: number
}

export type VideoSyncRunStatus = 'running' | 'completed' | 'partial' | 'failed'
export type VideoSyncRun = {
  id: string
  idempotencyKey: string
  source: string
  status: VideoSyncRunStatus
  startedAt: string
  finishedAt?: string
  totalRows: number
  insertedRows: number
  updatedRows: number
  errorMessage?: string
}

export type VideoIdeaTypeAnalytics = {
  videoType: VideoType
  averageCompletionRate: number
}

export type RankedViralFeature = {
  value: string
  count: number
}

export type ViralFeatureSummary = {
  titleWords: RankedViralFeature[]
  videoTypes: RankedViralFeature[]
  tags: RankedViralFeature[]
  dateSegments: RankedViralFeature[]
}

export type ImportHistory = {
  id: string
  importedAt: string
  fileName: string
  totalRows: number
  newCount: number
  updatedCount: number
  snapshot: MetricSnapshot
  created: string
}

export type CompetitorAccount = {
  id: string
  name: string
  platform: string
  profileUrl: string
  category: string
  followerCount: number
  averageViews: number
  notes: string
  created: string
  updated: string
}

export type CompetitorVideo = {
  id: string
  competitorId: string
  title: string
  url: string
  publishDate: string
  views: number
  likes: number
  contentTags: string
  whyViral: string
  referenceTo: string
  created: string
  updated: string
}

export type CompetitorVideoInput = Omit<
  CompetitorVideo,
  'id' | 'created' | 'updated'
>

export type HeatLevel = '高' | '中' | '低'

export type TrendingTopic = {
  id: string
  topic: string
  source: string
  keywords: string
  heatLevel: HeatLevel
  insight: string
  referenceUrl: string
  discoveredAt: string
  convertedToIdea: boolean
  created: string
  updated: string
}

export type TrendingTopicInput = Omit<
  TrendingTopic,
  'id' | 'convertedToIdea' | 'created' | 'updated'
>

export type CompetitorStyleAnalysis = {
  id: string
  competitorId: string
  contentStyle: string
  titlePattern: string
  hookMethod: string
  editingStyle: string
  viralFactors: string
  applicableToUs: string
  analyzedAt: string
  created: string
}

export type CompetitorStyleAnalysisInput = Omit<
  CompetitorStyleAnalysis,
  'id' | 'created'
>

export type EditingSearchParams = VideoIdeaListParams & {
  section: EditingSection
  tab: IdeaTab
  ideaId?: string
  competitorId?: string
  recordType?: 'video'
  recordId?: string
}
