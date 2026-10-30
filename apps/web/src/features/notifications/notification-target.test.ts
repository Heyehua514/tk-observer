/** 通知深链解析纯函数测试；权限：无数据写入。 */
import type { AppNotification } from '@/types/notification'
import { describe, expect, it } from 'vitest'
import {
  buildNotificationSearch,
  resolveNotificationTarget,
} from './notification-target'

function notification(overrides: Partial<AppNotification>): AppNotification {
  return {
    id: 'notification-1',
    recipient: 'user-1',
    type: 'design_review',
    title: '审核结果',
    content: '设计稿已更新',
    link: '/design',
    isRead: false,
    created: '2026-10-29T00:00:00.000Z',
    ...overrides,
  }
}

describe('resolveNotificationTarget', () => {
  it('preserves the design asset record identity for a workbench deep link', () => {
    expect(
      resolveNotificationTarget(
        notification({
          recordType: 'design_asset',
          recordId: 'asset-42',
        })
      )
    ).toEqual({
      to: '/design',
      recordType: 'design_asset',
      recordId: 'asset-42',
    })
  })

  it('preserves opportunity and event task targets', () => {
    expect(
      resolveNotificationTarget(
        notification({
          link: '/business',
          recordType: 'opportunity',
          recordId: 'opportunity-7',
        })
      )
    ).toEqual({
      to: '/business',
      recordType: 'opportunity',
      recordId: 'opportunity-7',
    })
    expect(
      resolveNotificationTarget(
        notification({
          link: '/market/events/event-9?source=notification',
          recordType: 'event_task',
          recordId: 'task-3',
        })
      )
    ).toEqual({
      to: '/market/events/event-9',
      taskId: 'task-3',
    })
  })

  it('falls back safely for unknown or mismatched links', () => {
    expect(
      resolveNotificationTarget(
        notification({
          link: 'https://example.test/phishing',
          recordType: 'design_asset',
          recordId: 'asset-42',
        })
      )
    ).toEqual({ to: '/overview' })
    expect(
      resolveNotificationTarget(
        notification({
          link: '/business',
          recordType: 'design_asset',
          recordId: 'asset-42',
        })
      )
    ).toEqual({ to: '/business' })
  })
})
describe('buildNotificationSearch', () => {
  it('builds exact record and task search params', () => {
    expect(
      buildNotificationSearch({
        to: '/design',
        recordType: 'design_asset',
        recordId: 'asset-42',
      })
    ).toEqual({ recordType: 'design_asset', recordId: 'asset-42' })
    expect(
      buildNotificationSearch({
        to: '/market/events/event-9',
        taskId: 'task-3',
      })
    ).toEqual({ taskId: 'task-3' })
    expect(buildNotificationSearch({ to: '/overview' })).toEqual({})
  })
})
