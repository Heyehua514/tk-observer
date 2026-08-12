/**
 * 用途：闭环规则的确定性评估入口。
 * 所属工作台：总览 + 商务 + 市场 + 设计。
 * 权限：仅本地运行，不访问 PocketBase。
 */
const assert = require('node:assert/strict')
const {
  validateOpportunity,
  validateFinance,
  validateDesignSubmission,
  usagePatch,
} = require('../pb_hooks/lib/closed-loop-rules.js')

assert.throws(() => validateOpportunity({ type: 'event_sponsorship' }, { level: 'C' }))
assert.doesNotThrow(() =>
  validateOpportunity({ type: 'event_sponsorship' }, { level: 'B' }),
)
assert.throws(() => validateFinance({ amount: 0, category: 'venue', type: 'expense' }))
assert.throws(() => validateFinance({ amount: 1, category: 'venue', type: 'income' }))
assert.doesNotThrow(() =>
  validateFinance({ amount: 1, category: 'venue', type: 'expense' }),
)
assert.throws(() =>
  validateDesignSubmission({ status: 'pending_review', file: '' }),
)
assert.deepEqual(
  usagePatch('event_templates', { usage_count: 4 }, { last_used_at: 'use' }),
  { usage_count: 5, last_used_at: 'use' },
)
assert.deepEqual(
  usagePatch(
    'social_plans',
    { status: 'planned', linked_opportunity: '', usage_count: 1 },
    { status: 'published' },
  ),
  { usage_count: 2, last_used_at: '__NOW__' },
)
