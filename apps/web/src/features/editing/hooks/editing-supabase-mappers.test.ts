/** 剪辑工作台 Supabase 映射自检：保证迁移后 UI 模型不变。 */
import { describe, expect, it } from 'vitest'
import {
  mapSupabasePublishScheduleRecord,
  mapSupabaseVideoArchiveRecord,
  mapSupabaseVideoIdeaRecord,
  mapSupabaseVideoTaskRecord,
  serializeSupabasePublishSchedule,
  serializeSupabaseVideoIdea,
  toSupabaseVideoIdeaSort,
} from './editing-supabase-mappers'

describe('editing Supabase mappers', () => {
  it('maps video task rows to the existing production task UI shape', () => {
    expect(
      mapSupabaseVideoTaskRecord({
        id: 'task-1',
        title: '达人口播剪辑',
        product_name: 'TK增长课',
        creator_name: '跨境小杨',
        status: 'doing',
        due_at: '2026-08-12T10:00:00Z',
        owner_name: '谢洁',
      })
    ).toEqual({
      id: 'task-1',
      title: '达人口播剪辑',
      subtitle: 'TK增长课 · 跨境小杨',
      status: 'doing',
      dueAt: '2026-08-12',
      owner: '谢洁',
    })
  })

  it('maps video archive rows using Supabase file_path', () => {
    expect(
      mapSupabaseVideoArchiveRecord({
        id: 'video-1',
        title: '厦门沙龙切片',
        product_name: '金鳞会',
        creator_name: '韩素云',
        publish_at: '2026-08-10T09:00:00Z',
        file_path: 'videos/xiamen.mp4',
      })
    ).toMatchObject({
      fileUrl: 'videos/xiamen.mp4',
      publishAt: '2026-08-10',
    })
  })

  it('maps and serializes video ideas without changing frontend fields', () => {
    expect(
      mapSupabaseVideoIdeaRecord({
        id: 'idea-1',
        account: 'TK观察磊哥',
        video_type: '口播',
        title: '爆款复盘',
        description: null,
        source_url: null,
        tags: '复盘,TK',
        publish_date: '2026-08-12T00:00:00Z',
        views: 50000,
        likes: 1200,
        comments: 88,
        shares: 99,
        completion_rate: 63,
        follower_gain: 260,
        is_viral: true,
        created_at: '2026-08-12T01:00:00Z',
        updated_at: '2026-08-12T02:00:00Z',
      })
    ).toMatchObject({
      id: 'idea-1',
      description: '',
      publishDate: '2026-08-12',
      isViral: true,
      created: '2026-08-12T01:00:00Z',
      updated: '2026-08-12T02:00:00Z',
    })

    expect(
      serializeSupabaseVideoIdea({
        account: 'TK观察磊哥',
        videoType: '口播',
        title: '爆款复盘',
        description: '',
        sourceUrl: '',
        tags: '复盘,TK',
        publishDate: '2026-08-12',
        views: 50000,
        likes: 1200,
        comments: 88,
        shares: 99,
        completionRate: 63,
        followerGain: 260,
      })
    ).toMatchObject({
      video_type: '口播',
      source_url: null,
      publish_date: '2026-08-12 00:00:00.000Z',
      completion_rate: 63,
    })
  })

  it('converts PocketBase sort syntax to Supabase sort syntax', () => {
    expect(toSupabaseVideoIdeaSort('-views')).toBe('views.desc')
    expect(toSupabaseVideoIdeaSort('-completion_rate')).toBe(
      'completion_rate.desc'
    )
  })

  it('maps publish schedule rows to display items and serializes partial updates', () => {
    expect(
      mapSupabasePublishScheduleRecord({
        id: 'schedule-1',
        title: '厦门沙龙切片',
        account: 'TK观察磊哥',
        platform: '微信视频号',
        region: 'CN',
        publish_at: '2026-08-12T10:00:00Z',
        status: 'scheduled',
      })
    ).toMatchObject({
      id: 'schedule-1',
      title: '厦门沙龙切片',
      subtitle: '微信视频号 · CN',
      publishAt: '2026-08-12',
      status: 'scheduled',
    })

    expect(
      serializeSupabasePublishSchedule({
        videoId: 'video-1',
        videoTaskId: 'task-1',
        title: '专访正片',
        account: '跨境TK磊哥',
        region: 'US',
        platform: 'TikTok',
        publishAt: '2026-08-13T02:00:00Z',
        status: 'publishing',
        notes: '配合海外时段',
      })
    ).toEqual({
      video_id: 'video-1',
      video_task_id: 'task-1',
      title: '专访正片',
      account: '跨境TK磊哥',
      region: 'US',
      platform: 'TikTok',
      publish_at: '2026-08-13T02:00:00Z',
      status: 'publishing',
      notes: '配合海外时段',
    })
  })
})
