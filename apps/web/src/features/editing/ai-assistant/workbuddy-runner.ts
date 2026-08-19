/**
 * WorkBuddy(CodeBuddy) CLI 调用封装。
 * 用途：前端(浏览器)无法直接执行本机 CLI，本文件是给运行在本机的脚本/服务端侧使用的纯函数，
 *       生成传给 codebuddy 的提示词与解析规则；浏览器端只负责装配数据与展示结果。
 * 所属工作台：剪辑（谢洁）+ 全局 AI 助手。
 */
export const CODEBUDDY_CLI =
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'

export type VideoAnalysisResult = {
  titlePatterns: string[]
  publishTimePatterns: string[]
  contentTypePreferences: string[]
  summary: string
}

/**
 * 构造视频批量分析的提示词，要求 WorkBuddy 输出纯 JSON。
 */
export function buildVideoAnalysisPrompt(
  videos: Array<{ title: string; videoType: string; publishDate: string; views: number }>
): string {
  const payload = JSON.stringify(videos)
  return [
    '你是 TK 短视频运营数据分析助手。分析以下视频数据：',
    '- 标题规律',
    '- 发布时间规律',
    '- 内容类型偏好',
    '',
    '只输出一个 JSON 对象，不要任何额外文字或 Markdown 代码块：',
    '{"titlePatterns":["..."],"publishTimePatterns":["..."],"contentTypePreferences":["..."],"summary":"..."}',
    '',
    `数据：${payload}`,
  ].join('\n')
}

/** 从 WorkBuddy 输出中抽取 JSON（容忍首尾多余文本/代码块）。 */
export function parseVideoAnalysisJson(
  raw: string
): VideoAnalysisResult {
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
