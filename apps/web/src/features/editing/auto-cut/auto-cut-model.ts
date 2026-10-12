/**
 * 智能切片、深度视频对标与剪映工程核心领域模型。
 * 规范：长视频拆分2分钟切片、AI长期记忆持续进化、行业热点强结合。
 */

export type VideoSourceMode = 'file' | 'url'
export type AutoCutCategory = 'spoken' | 'ranking'
export type EditActionChoice = 'suggest' | 'direct_cut'

/** 2分钟切片小视频单元 */
export type VideoClipSlice = {
  id: string
  clipIndex: number
  title: string
  targetDurationSec: number // 目标约120秒
  startSec: number
  endSec: number
  hook3s: string // 黄金前3秒抓人开场
  coreConflict: string // 核心观点与生活痛点冲突
  goldenQuote: string // 结尾升华金句与引导互动
  suggestedBgm: string
  suggestedStickers: string[]
  subtitles: Array<{
    start: string
    end: string
    text: string
  }>
}

/** 深度对标与长视频诊断报告 */
export type VideoDeepDiagnosis = {
  sourceNameOrUrl: string
  category: AutoCutCategory
  originalDurationSec: number
  overallPersona: {
    targetAudience: string
    toneStyle: string
    emotionalDensity: string
    speakingRate: string // 语速节奏
  }
  viralDNA: {
    hookPatterns: string[]
    corePainPoints: string[]
    commentControversies: string[] // 评论区争议焦点与需求
  }
  hotNewsRelevance: {
    industryTopic: string // 强关联出海/跨境热点
    relevanceReason: string
    suggestedHook: string
  }
  slices: VideoClipSlice[]
  learnedExperienceSummary: string // 本次提炼的可复用记忆沉淀
}

/** 剪映电脑版草稿导出结构 */
export type JianyingDraftExport = {
  draftName: string
  draftPath: string // 自动生成的文件夹完整路径
  createdAt: string
  clipCount: number
  totalDurationFormatted: string
  tracks: {
    videoClips: number
    audioTracks: number
    subtitleTracks: number
  }
  isDirectCutReady: boolean
  rawDraftJson?: string
}
