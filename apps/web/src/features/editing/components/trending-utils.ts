import { heatLevels } from '../constants'
import type { TrendingTopicInput } from '../types'

export function parseTopicBlocks(text: string): TrendingTopicInput[] {
  const blocks = text
    .split(/\n\s*(?:---+|\n)\s*\n?/u)
    .map((block) => block.trim())
    .filter(Boolean)
  return blocks.map((block) => {
    const fields = new Map<string, string>()
    let fallbackTitle = ''
    const insightLines: string[] = []
    for (const raw of block.split(/\r?\n/u)) {
      const line = raw.replace(/^[-*#\d.、\s]+/u, '').trim()
      if (!line) continue
      const matched = line.match(
        /^(话题|来源|关键词|热度|启发|选题启发|链接|参考链接)[：:]\s*(.*)$/u
      )
      if (matched) fields.set(matched[1], matched[2].trim())
      else if (!fallbackTitle) fallbackTitle = line
      else insightLines.push(line)
    }
    const topic = fields.get('话题') || fallbackTitle
    if (!topic) throw new Error('每条调研结果都需要话题名称')
    const rawHeat = fields.get('热度') || '中'
    const heatLevel = heatLevels.includes(rawHeat as (typeof heatLevels)[number])
      ? (rawHeat as TrendingTopicInput['heatLevel'])
      : '中'
    return {
      topic,
      source: fields.get('来源') || 'AI 辅助行业调研',
      keywords: fields.get('关键词') || '',
      heatLevel,
      insight: fields.get('启发') || fields.get('选题启发') || insightLines.join('\n'),
      referenceUrl: fields.get('链接') || fields.get('参考链接') || '',
      discoveredAt: new Date().toISOString().slice(0, 10),
    }
  })
}
