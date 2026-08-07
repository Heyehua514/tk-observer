/** 爆款选题 CSV 模板、解析与导出工具；使用 Papa Parse 处理引号、逗号和换行。 */
import { z } from 'zod'
import Papa from 'papaparse'
import {
  accountVideoTypes,
  csvTemplateHeaders,
  videoAccounts,
  videoTypes,
} from '../constants'
import type { VideoIdea, VideoIdeaInput } from '../types'

const csvRowSchema = z.object({
  标题: z.string().trim().min(1, '标题不能为空'),
  账号: z.string().trim(),
  视频类型: z.string().trim(),
  播放量: z.string().optional().default('0'),
  完播率: z.string().optional().default('0'),
  涨粉: z.string().optional().default('0'),
  点赞: z.string().optional().default('0'),
  评论: z.string().optional().default('0'),
  转发: z.string().optional().default('0'),
  发布日期: z.string().trim().min(1, '发布日期不能为空'),
  标签: z.string().optional().default(''),
  内容简述: z.string().optional().default(''),
})

function integer(value: string, field: string) {
  const parsed = Number(value || 0)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${field}必须是大于等于 0 的整数`)
  }
  return parsed
}

function normalizeDate(value: string) {
  const normalized = value.replace(/\//g, '-').trim()
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/u.test(normalized)) {
    throw new Error('发布日期格式应为 YYYY-MM-DD')
  }
  const [year, month, day] = normalized.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('发布日期不是有效日期')
  }
  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export async function parseVideoIdeaCsv(file: File): Promise<VideoIdeaInput[]> {
  const text = await file.text()
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length)
    throw new Error(`CSV 解析失败：${parsed.errors[0].message}`)
  return parsed.data.map((raw, index) => {
    const row = csvRowSchema.safeParse(raw)
    if (!row.success) {
      throw new Error(
        `第 ${index + 2} 行：${row.error.issues[0]?.message || '字段无效'}`
      )
    }
    const value = row.data
    if (!videoAccounts.includes(value.账号 as (typeof videoAccounts)[number])) {
      throw new Error(`第 ${index + 2} 行：账号不在允许名单中`)
    }
    if (!videoTypes.includes(value.视频类型 as (typeof videoTypes)[number])) {
      throw new Error(`第 ${index + 2} 行：视频类型不在允许名单中`)
    }
    const account = value.账号 as VideoIdeaInput['account']
    const videoType = value.视频类型 as VideoIdeaInput['videoType']
    if (!accountVideoTypes[account].includes(videoType)) {
      throw new Error(`第 ${index + 2} 行：该账号不支持此视频类型`)
    }
    const completionRate = integer(value.完播率, '完播率')
    if (completionRate > 100)
      throw new Error(`第 ${index + 2} 行：完播率不能超过 100`)
    return {
      account,
      videoType,
      title: value.标题.trim(),
      description: value.内容简述.trim(),
      sourceUrl: '',
      tags: value.标签.trim(),
      publishDate: normalizeDate(value.发布日期),
      views: integer(value.播放量, '播放量'),
      likes: integer(value.点赞, '点赞'),
      comments: integer(value.评论, '评论'),
      shares: integer(value.转发, '转发'),
      completionRate,
      followerGain: integer(value.涨粉, '涨粉'),
    }
  })
}

export function exportVideoIdeasCsv(ideas: readonly VideoIdea[]) {
  const rows = ideas.map((idea) => ({
    标题: idea.title,
    账号: idea.account,
    视频类型: idea.videoType,
    播放量: idea.views,
    完播率: idea.completionRate,
    涨粉: idea.followerGain,
    点赞: idea.likes,
    评论: idea.comments,
    转发: idea.shares,
    发布日期: idea.publishDate,
    标签: idea.tags,
    内容简述: idea.description,
  }))
  return `\ufeff${Papa.unparse(rows, { columns: [...csvTemplateHeaders] })}`
}
