/**
 * 用途：验证公众号分析的数据规则与服务端爆款计算 Hook。
 * 所属工作台：商务工作台。
 * 权限：仅测试，不访问真实 PocketBase。
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const record = (fields) => ({
  fields: { ...fields },
  get(name) {
    return this.fields[name]
  },
})

test('migration adds the business permissions, blog fields, and industry values', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../pb_migrations/1786104000_business_blog.js'),
    'utf8',
  )
  for (const field of ['title', 'account', 'publish_date', 'is_viral', 'analysis_notes', 'source_url']) {
    assert.match(source, new RegExp(`name: ['"]${field}['"]`))
  }
  assert.match(source, /\['views', 'likes', 'shares'\]/)
  for (const value of ['ai_tool', 'creator_tool', 'erp', 'payment', 'finance_tax']) {
    assert.match(source, new RegExp(`['"]${value}['"]`))
  }
  assert.match(source, /business.*boss|boss.*business/)
  assert.match(source, /霞光社/)
  assert.match(source, /白鲸出海/)
  assert.match(source, /晚点财经/)
})

test('blog article hook recalculates viral status from the account average', () => {
  const updates = []
  const context = {
    $app: {
      db: () => ({
        newQuery: (sql) => ({ execute: () => updates.push({ sql }) }),
      }),
    },
    onRecordAfterCreateSuccess: (callback, collection) => {
      assert.equal(collection, 'blog_articles')
      callback({ next: () => {} })
    },
    onRecordAfterUpdateSuccess: (callback, collection) => {
      assert.equal(collection, 'blog_articles')
      callback({ next: () => {} })
    },
    onRecordAfterDeleteSuccess: (callback, collection) => {
      assert.equal(collection, 'blog_articles')
      callback({ next: () => {} })
    },
  }
  vm.runInNewContext(
    fs.readFileSync(path.resolve(__dirname, '../pb_hooks/blog_articles.pb.js'), 'utf8'),
    context,
  )
  assert.equal(updates.length, 3)
  assert.match(updates[0].sql, /AVG\(peer\.views\)/)
  assert.match(updates[0].sql, /is_viral/)
})

test('viral field cannot be written by the business client', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../pb_migrations/1786104000_business_blog.js'),
    'utf8',
  )
  assert.match(source, /@request\.body\.is_viral:isset = false/)
})
