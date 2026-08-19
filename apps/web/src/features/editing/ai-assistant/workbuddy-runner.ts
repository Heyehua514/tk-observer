/**
 * WorkBuddy(CodeBuddy) CLI 调用封装与提示词构造。
 * 所属工作台：剪辑（谢洁）+ 全局 AI 助手。
 */
export const CODEBUDDY_CLI =
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'

export type VideoPerItemAnalysis = {
  id: string
  insight: string
}

export type VideoAnalysisResult = {
  titlePatterns: string[]
  publishTimePatterns: string[]
  contentTypePreferences: string[]
  summary: string
}

/**
 * 构造视频批量分析的提示词，返回逐条洞察 + 汇总规律。
 */
export function buildVideoAnalysisPrompt(
  videos: Array<{ id: string; title: string; videoType: string; publishDate: string; views: number }>
): string {
  const payload = JSON.stringify(
    videos.map((v) => ({
      id: v.id,
      title: v.title,
      videoType: v.videoType,
      publishDate: v.publishDate,
      views: v.views,
    }))
  )
  return [
    '你是 TK 短视频运营数据分析助手。分析以下视频数据：',
    '- 为每一条视频给出 1 条精炼洞察（insight），说明其可借鉴之处',
    '- 再给出标题规律、发布时间规律、内容类型偏好和整体总结',
    '',
    '只输出一个 JSON 对象，不要任何额外文字或 Markdown 代码块：',
    '{"videos":[{"id":"<原id>","insight":"<该条洞察>"}],"titlePatterns":["..."],"publishTimePatterns":["..."],"contentTypePreferences":["..."],"summary":"..."}',
    '',
    `数据：${payload}`,
  ].join('\n')
}

/** 从 WorkBuddy 输出中抽取 JSON（容忍首尾多余文本/代码块）。 */
export function parseVideoAnalysisJson(raw: string): VideoAnalysisResult & {
  videos: VideoPerItemAnalysis[]
} {
  const text = raw.trim()
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('未从 WorkBuddy 输出中解析到 JSON')
  }
  const parsed = JSON.parse(candidate.slice(start, end + 1))
  return {
    videos: Array.isArray(parsed.videos) ? parsed.videos : [],
    titlePatterns: Array.isArray(parsed.titlePatterns)
      ? parsed.titlePatterns.map(String)
      : [],
    publishTimePatterns: Array.isArray(parsed.publishTimePatterns)
      ? parsed.publishTimePatterns.map(String)
      : [],
    contentTypePreferences: Array.isArray(parsed.contentTypePreferences)
      ? parsed.contentTypePreferences.map(String)
      : [],
    summary: String(parsed.summary || ''),
  }
}
