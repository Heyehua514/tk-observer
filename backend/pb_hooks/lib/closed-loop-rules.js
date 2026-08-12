/** 闭环规则与模板使用记录；所属工作台：总览 / 商务 / 市场 / 设计。 */
class RuleError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'RuleError'
    this.code = code
  }
}

const incomeCategories = new Set(['sponsorship_income', 'ticket_income'])

const hasFile = (value) => {
  if (Array.isArray(value)) return value.length > 0 && String(value[0] || '').trim() !== ''
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return String(value || '').trim() !== ''
}

const mergedValue = (before, body, key) => {
  if (body && Object.prototype.hasOwnProperty.call(body, key)) return body[key]
  return before ? before[key] : undefined
}

const validateOpportunity = (payload, client) => {
  if (String(payload.type || '') !== 'event_sponsorship') return payload
  const level = String(client && client.level ? client.level : '').toUpperCase()
  if (!['S', 'A', 'B'].includes(level)) {
    throw new RuleError(
      'EVENT_SPONSORSHIP_CLIENT_LEVEL',
      '活动招商只能关联重要度 B 及以上的客户',
    )
  }
  return payload
}

const validateFinance = (payload) => {
  if (Number(payload.amount) <= 0) {
    throw new RuleError('FINANCE_AMOUNT_POSITIVE', '活动财务金额必须大于 0')
  }
  const expectedType = incomeCategories.has(String(payload.category || ''))
    ? 'income'
    : 'expense'
  if (String(payload.type || '') !== expectedType) {
    throw new RuleError(
      'FINANCE_TYPE_MISMATCH',
      '活动财务收支类型必须与类别方向一致',
    )
  }
  return payload
}

const validateDesignSubmission = (record) => {
  if (String(record.status || '') !== 'pending_review') return record
  if (!hasFile(record.file)) {
    throw new RuleError('DESIGN_FILE_REQUIRED', '提交设计稿审核前必须上传缩略图文件')
  }
  return record
}

const usagePatch = (collectionName, before = {}, body = {}) => {
  const currentUsage = Number(before.usage_count || 0)
  if (collectionName === 'event_templates') {
    if (!Object.prototype.hasOwnProperty.call(body, 'last_used_at')) return null
    return {
      usage_count: currentUsage + 1,
      last_used_at: body.last_used_at,
    }
  }

  if (collectionName !== 'social_plans') return null

  const beforeStatus = String(before.status || '')
  const afterStatus = mergedValue(before, body, 'status')
  const beforeLink = String(before.linked_opportunity || '')
  const afterLink = String(mergedValue(before, body, 'linked_opportunity') || '')
  const enteredPublished =
    beforeStatus !== 'published' && String(afterStatus || '') === 'published'
  const gainedLink = !beforeLink && !!afterLink
  if (!enteredPublished && !gainedLink) return null
  return {
    usage_count: currentUsage + 1,
    last_used_at: '__NOW__',
  }
}

module.exports = {
  RuleError,
  validateOpportunity,
  validateFinance,
  validateDesignSubmission,
  usagePatch,
}
