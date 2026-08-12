/**
 * 用途：验证闭环规则校验和模板使用记录逻辑。
 * 所属工作台：总览 + 商务 + 市场工作台。
 * 权限：仅本地确定性测试，不访问真实 PocketBase。
 */
const assert = require('node:assert/strict')
const test = require('node:test')

const {
  validateOpportunity,
  validateFinance,
  validateDesignSubmission,
  usagePatch,
  RuleError,
} = require('../pb_hooks/lib/closed-loop-rules.js')

const expectRuleError = (fn, code, message) => {
  assert.throws(fn, (error) => {
    assert(error instanceof RuleError)
    assert.equal(error.code, code)
    if (message) assert.match(error.message, message)
    return true
  })
}

test('rejects event sponsorship opportunities from level C clients', () => {
  expectRuleError(
    () => validateOpportunity({ type: 'event_sponsorship' }, { level: 'C' }),
    'EVENT_SPONSORSHIP_CLIENT_LEVEL',
    /活动招商/,
  )
})

test('allows event sponsorship opportunities from level B clients', () => {
  assert.doesNotThrow(() =>
    validateOpportunity({ type: 'event_sponsorship' }, { level: 'B' }),
  )
})

test('rejects finance records with non-positive amount', () => {
  expectRuleError(
    () => validateFinance({ amount: 0, category: 'venue', type: 'expense' }),
    'FINANCE_AMOUNT_POSITIVE',
    /金额/,
  )
})

test('rejects finance records with mismatched type and category', () => {
  expectRuleError(
    () => validateFinance({ amount: 100, category: 'venue', type: 'income' }),
    'FINANCE_TYPE_MISMATCH',
    /收支/,
  )
})

test('allows finance records when type matches category direction', () => {
  assert.doesNotThrow(() =>
    validateFinance({ amount: 100, category: 'venue', type: 'expense' }),
  )
})

test('rejects design submissions without a file in review state', () => {
  expectRuleError(
    () => validateDesignSubmission({ status: 'pending_review', file: '' }),
    'DESIGN_FILE_REQUIRED',
    /缩略图|文件/,
  )
})

test('allows design submissions with a file in review state', () => {
  assert.doesNotThrow(() =>
    validateDesignSubmission({ status: 'pending_review', file: ['cover.png'] }),
  )
})

test('increments template usage count when event templates are used', () => {
  assert.deepEqual(
    usagePatch('event_templates', { usage_count: 4 }, { last_used_at: 'use' }),
    { usage_count: 5, last_used_at: 'use' },
  )
})

test('increments social plan usage count when published from planned', () => {
  assert.deepEqual(
    usagePatch(
      'social_plans',
      { status: 'planned', linked_opportunity: '', usage_count: 0 },
      { status: 'published' },
    ),
    { usage_count: 1, last_used_at: '__NOW__' },
  )
})

test('increments social plan usage count when linked opportunity is filled', () => {
  assert.deepEqual(
    usagePatch(
      'social_plans',
      { status: 'planned', linked_opportunity: '', usage_count: 2 },
      { linked_opportunity: 'opp_1' },
    ),
    { usage_count: 3, last_used_at: '__NOW__' },
  )
})

test('does not increment social plan usage twice for already published records', () => {
  assert.equal(
    usagePatch(
      'social_plans',
      { status: 'published', linked_opportunity: '', usage_count: 1 },
      { status: 'published' },
    ),
    null,
  )
})
