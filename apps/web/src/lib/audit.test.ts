/** 审计写入模型测试；权限：无数据写入。 */
import { describe, expect, it } from 'vitest'
import { buildAuditPayload } from './audit'

describe('buildAuditPayload', () => {
  it('serializes a business action into Supabase audit log fields', () => {
    expect(
      buildAuditPayload({
        actorName: '董雨辰',
        action: '新增合作公司',
        entityType: 'companies',
        entityId: 'company-1',
      })
    ).toEqual({
      actor_name: '董雨辰',
      action: '新增合作公司',
      entity_type: 'companies',
      entity_id: 'company-1',
    })
  })
})
