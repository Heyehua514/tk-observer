/** 任务模板与 WorkBuddy 建议纯逻辑；不访问外部 API。 */
const matchTemplate = (goal, templates) => {
  const text = String(goal).toLowerCase()
  let best = null
  let score = 0
  for (const template of templates) {
    const hits = template.trigger_keywords.filter((keyword) => text.includes(String(keyword).toLowerCase())).length
    const ratio = hits / Math.max(template.trigger_keywords.length, 1)
    if (ratio >= 0.5 && ratio > score) { best = template; score = ratio }
  }
  return best
}

const validateSteps = (steps, participantRoles) => {
  const orders = new Set(steps.map((step) => step.order))
  for (const step of steps) {
    if (!step.role) throw new Error('assignee role missing or invalid')
    if (!participantRoles.includes(step.role)) throw new Error('participant role missing')
    if (!Array.isArray(step.deliverables) || step.deliverables.length === 0) throw new Error('deliverables required')
    if (!step.reviewerRole) throw new Error('reviewer role required')
    for (const dependency of step.dependsOn || []) if (!orders.has(dependency)) throw new Error('dependency step missing')
  }
  const visiting = new Set()
  const visited = new Set()
  const byOrder = new Map(steps.map((step) => [step.order, step]))
  const visit = (order) => {
    if (visiting.has(order)) throw new Error('step cycle detected')
    if (visited.has(order)) return
    visiting.add(order)
    for (const dependency of byOrder.get(order).dependsOn || []) visit(dependency)
    visiting.delete(order); visited.add(order)
  }
  for (const step of steps) visit(step.order)
  return true
}

const parseWorkBuddySuggestion = (raw) => {
  const outer = JSON.parse(raw)
  const payload = typeof outer.result === 'string' ? JSON.parse(outer.result) : outer
  if (!payload || Object.keys(payload).some((key) => !['suggestedSteps', 'riskAlerts'].includes(key))) throw new Error('invalid suggestion fields')
  if (!Array.isArray(payload.suggestedSteps) || !Array.isArray(payload.riskAlerts) || payload.riskAlerts.some((item) => typeof item !== 'string')) throw new Error('invalid suggestion types')
  return payload
}

const detectTimeConflict = (steps, deadline, now) => {
  const requiredDays = steps.reduce((sum, step) => sum + Number(step.estimatedDays || 0), 0)
  const availableDays = Math.floor((new Date(deadline).getTime() - now.getTime()) / 86400000)
  return { conflict: requiredDays > availableDays, requiredDays, availableDays }
}

const suggestWorkflow = ({ goal, deadline, participantRoles, templates }) => {
  const matchedTemplate = matchTemplate(goal, templates)
  if (matchedTemplate) return { matchedTemplate, suggestedSteps: matchedTemplate.steps, riskAlerts: [] }
  const role = participantRoles[0] || 'business'
  const reviewerRole = participantRoles.includes('boss') ? 'boss' : role
  return {
    matchedTemplate: null,
    suggestedSteps: [
      { order: 1, title: String(goal), role, dependsOn: [], deliverables: ['执行结果'], estimatedDays: 1, acceptanceCriteria: '结果可验收', reviewerRole },
      { order: 2, title: '复核并交付', role: reviewerRole, dependsOn: [1], deliverables: ['交付确认'], estimatedDays: 1, acceptanceCriteria: '完成确认', reviewerRole },
    ],
    riskAlerts: [],
  }
}

module.exports = { detectTimeConflict, matchTemplate, parseWorkBuddySuggestion, suggestWorkflow, validateSteps }
