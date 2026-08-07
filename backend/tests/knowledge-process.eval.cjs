/**
 * 用途：评估知识提炼结果是否满足可引用、可执行的质量门槛。
 * 所属工作台：知识库。
 * 权限：默认仅运行确定性 fixture；真实 WorkBuddy 调用需显式启用。
 */
const assert = require('node:assert/strict')
const test = require('node:test')

const { parseKnowledgeResult } = require('../pb_hooks/lib/knowledge-process.js')

test('representative meeting extraction passes the knowledge quality contract', () => {
  const result = parseKnowledgeResult(
    JSON.stringify({
      summary: '团队决定先交付样片，再按反馈制作全量视频。',
      decisions: ['先完成一条样片'],
      actionItems: [{ task: '周五 18:00 前交付样片', owner: '剪辑负责人' }],
      risks: ['客户素材若晚于周三到达会影响交付'],
      sops: ['收集素材', '确认脚本', '制作样片', '客户确认后批量制作'],
      failedLessons: ['未确认脚本前不要批量制作'],
      quoteSnippets: ['先做一条样片，确认后再批量做。'],
      qualityScore: 92,
    }),
  )

  assert.match(result.summary, /样片/)
  assert.ok(result.quoteSnippets.some((quote) => quote.includes('先做一条样片')))
  assert.ok(result.actionItems.every((item) => item.task.trim().length > 0))
  assert.ok(result.qualityScore >= 80)
})
