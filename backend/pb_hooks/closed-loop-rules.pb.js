/**
 * 闭环规则校验与模板使用计数自动维护。
 * 所属工作台：总览 / 商务 / 市场 / 设计。
 * 权限：仅服务端 hook 调用，客户端不能绕过校验。
 */
const {
  RuleError,
  validateOpportunity,
  validateFinance,
  validateDesignSubmission,
  usagePatch,
} = require(`${__hooks}/lib/closed-loop-rules.js`)

const requestBody = (event) => event.requestInfo().body || {}

const mergedRecord = (event, keys) => {
  const body = requestBody(event)
  const original =
    typeof event.record.original === 'function' ? event.record.original() : null
  const merged = {}
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      merged[key] = body[key]
      continue
    }
    if (original) {
      merged[key] = original.get(key)
      continue
    }
    merged[key] = event.record.get(key)
  }
  return merged
}

const findClient = (event) => {
  const body = requestBody(event)
  const original =
    typeof event.record.original === 'function' ? event.record.original() : null
  const clientId = String(
    Object.prototype.hasOwnProperty.call(body, 'client')
      ? body.client
      : original
        ? original.get('client')
        : event.record.get('client') || '',
  ).trim()
  if (!clientId) return null
  try {
    return $app.findRecordById('clients', clientId)
  } catch (_) {
    return null
  }
}

const applyOpportunityRules = (event) => {
  const payload = mergedRecord(event, ['type', 'client', 'stage', 'lost_reason'])
  validateOpportunity(payload, findClient(event))
  if (String(payload.stage || '') === 'lost' && !String(payload.lost_reason || '').trim()) {
    throw new BadRequestError('商机流失必须填写原因')
  }
}

const applyFinanceRules = (event) => {
  const payload = mergedRecord(event, ['amount', 'category', 'type'])
  validateFinance(payload)
}

const applyDesignRules = (event) => {
  const payload = mergedRecord(event, ['status', 'file'])
  validateDesignSubmission(payload)
}

const applyUsageRules = (collectionName, event) => {
  const original =
    typeof event.record.original === 'function' ? event.record.original() : null
  const before = {
    usage_count: original ? original.get('usage_count') : event.record.get('usage_count'),
    status: original ? original.get('status') : event.record.get('status'),
    linked_opportunity: original
      ? original.get('linked_opportunity')
      : event.record.get('linked_opportunity'),
  }
  const body = requestBody(event)
  const patch = usagePatch(collectionName, before, body)
  if (!patch) return
  if (Object.prototype.hasOwnProperty.call(patch, 'usage_count')) {
    event.record.set('usage_count', patch.usage_count)
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'last_used_at')) {
    event.record.set(
      'last_used_at',
      patch.last_used_at === '__NOW__' ? new Date().toISOString() : patch.last_used_at,
    )
  }
}

onRecordCreateRequest(
  (event) => {
    try {
      applyOpportunityRules(event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'opportunities',
)

onRecordUpdateRequest(
  (event) => {
    try {
      applyOpportunityRules(event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'opportunities',
)

onRecordCreateRequest(
  (event) => {
    try {
      applyFinanceRules(event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'event_finances',
)

onRecordUpdateRequest(
  (event) => {
    try {
      applyFinanceRules(event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'event_finances',
)

onRecordUpdateRequest(
  (event) => {
    try {
      applyDesignRules(event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'design_assets',
)

onRecordCreateRequest(
  (event) => {
    try {
      applyUsageRules('event_templates', event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'event_templates',
)

onRecordUpdateRequest(
  (event) => {
    try {
      applyUsageRules('event_templates', event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'event_templates',
)

onRecordCreateRequest(
  (event) => {
    try {
      applyUsageRules('social_plans', event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'social_plans',
)

onRecordUpdateRequest(
  (event) => {
    try {
      applyUsageRules('social_plans', event)
      event.next()
    } catch (error) {
      if (error instanceof RuleError) throw new BadRequestError(error.message)
      throw error
    }
  },
  'social_plans',
)
