/**
 * 用途：评估任务建议在代表性业务目标上的结构完整性和风险识别质量。
 * 权限：默认运行确定性模板评估；仅显式启用时调用本机 WorkBuddy CLI。
 */
const assert = require('node:assert/strict')
const test = require('node:test')

const { suggestWorkflow } = require('../pb_hooks/lib/task-engine.js')

test('representative video goal produces a complete executable workflow', () => {
  const steps = [
    { order: 1, title: '脚本', role: 'market', dependsOn: [], deliverables: ['脚本'], estimatedDays: 2, acceptanceCriteria: '通过审核', reviewerRole: 'boss' },
    { order: 2, title: '成片', role: 'editing', dependsOn: [1], deliverables: ['成片'], estimatedDays: 3, acceptanceCriteria: '可发布', reviewerRole: 'boss' },
  ]
  const result = suggestWorkflow(
    {
      goal: '制作并剪辑一条视频',
      deadline: '2026-08-20T00:00:00.000Z',
      participantRoles: ['market', 'editing', 'boss'],
      templates: [{ id: 'video', name: '视频制作', trigger_keywords: ['视频', '剪辑'], steps }],
    },
    { now: new Date('2026-08-07T00:00:00.000Z'), workbuddy: () => assert.fail('unexpected fallback') },
  )

  assert.equal(result.suggestedSteps.every((step) => step.role && step.reviewerRole && step.deliverables.length), true)
  assert.deepEqual(result.riskAlerts, [])
})

