/** 剪辑工作台错误/空态文案自检，避免 Supabase-first 页面回退到 PocketBase 专属提示。 */
import { describe, expect, it } from 'vitest'
import {
  editingDataErrorDescription,
  editingEmptyTitles,
  editingPermissionErrorDescription,
} from './editing-empty-copy'

describe('editing empty and error copy', () => {
  it('does not expose PocketBase-only failure wording in Supabase-first components', () => {
    expect(editingDataErrorDescription).toBe(
      '请检查数据服务和当前账号权限后重试。'
    )
    expect(editingPermissionErrorDescription).toBe(
      '请检查数据服务和当前账号权限。'
    )
    expect(editingDataErrorDescription).not.toContain('PocketBase')
    expect(editingPermissionErrorDescription).not.toContain('PocketBase')
    expect(Object.values(editingEmptyTitles)).toEqual([
      '等待视频任务创建',
      '等待热点话题沉淀',
      '等待发布排期沉淀',
    ])
    for (const title of Object.values(editingEmptyTitles)) {
      expect(title).not.toContain('暂无')
    }
  })
})
