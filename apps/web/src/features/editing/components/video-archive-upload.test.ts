/**
 * 成片归档上传纯函数测试：文件校验边界、存储路径安全、videos 行序列化。
 */
import { describe, expect, it, vi } from 'vitest'
import {
  VIDEO_FILE_SIZE_LIMIT,
  buildVideoFilePath,
  isSupportedVideoFile,
  serializeVideoArchiveInput,
} from './video-archive-upload'

describe('isSupportedVideoFile', () => {
  it('接受合法类型且大小在 1B 到 512MB 边界', () => {
    expect(isSupportedVideoFile({ type: 'video/mp4', size: 1 })).toBe(true)
    expect(
      isSupportedVideoFile({
        type: 'video/webm',
        size: VIDEO_FILE_SIZE_LIMIT,
      })
    ).toBe(true)
    expect(
      isSupportedVideoFile({
        type: 'video/quicktime',
        size: Math.floor(VIDEO_FILE_SIZE_LIMIT / 2),
      })
    ).toBe(true)
  })

  it('拒绝 0 字节文件', () => {
    expect(isSupportedVideoFile({ type: 'video/mp4', size: 0 })).toBe(false)
  })

  it('拒绝超过 512MB 的文件', () => {
    expect(
      isSupportedVideoFile({
        type: 'video/mp4',
        size: VIDEO_FILE_SIZE_LIMIT + 1,
      })
    ).toBe(false)
  })

  it('拒绝非法 MIME 类型', () => {
    expect(isSupportedVideoFile({ type: 'application/pdf', size: 1024 })).toBe(
      false
    )
    expect(isSupportedVideoFile({ type: 'video/avi', size: 1024 })).toBe(false)
  })
})

describe('buildVideoFilePath', () => {
  it('文件名中的特殊字符被替换为连字符，ownerId 目录前缀保持', () => {
    const path = buildVideoFilePath('user-1', '厦门 正片（终版）!@#.mp4')
    expect(path.startsWith('user-1/')).toBe(true)
    const name = path.split('/').slice(1).join('/')
    expect(name).toMatch(/^\d+-[\w.-]+\.mp4$/)
    expect(name).not.toContain(' ')
    expect(name).not.toContain('!')
    expect(name).not.toContain('@')
  })

  it('空 ownerId 回退 anonymous 目录', () => {
    expect(buildVideoFilePath('', 'a.mp4').startsWith('anonymous/')).toBe(true)
  })

  it('两次构建生成不同时间戳，不会互相覆盖', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T10:00:00Z'))
    const first = buildVideoFilePath('user-1', 'a.mp4')
    vi.setSystemTime(new Date('2026-08-15T10:00:01Z'))
    const second = buildVideoFilePath('user-1', 'a.mp4')
    vi.useRealTimers()
    expect(first).not.toBe(second)
  })
})

describe('serializeVideoArchiveInput', () => {
  it('可选字段为空时序列化为 null，必填字段透传', () => {
    const row = serializeVideoArchiveInput(
      {
        title: '正片',
        region: 'US',
        publishAt: '',
        productName: '',
        creatorName: '',
      },
      'user-1/123-a.mp4'
    )
    expect(row).toEqual({
      title: '正片',
      region: 'US',
      file_path: 'user-1/123-a.mp4',
      publish_at: null,
      product_name: null,
      creator_name: null,
    })
  })

  it('有值时完整写入并保留原始内容', () => {
    const row = serializeVideoArchiveInput(
      {
        title: '闭门沙龙',
        region: 'CN',
        publishAt: '2026-08-15',
        productName: 'TK 陪跑',
        creatorName: '磊哥',
      },
      'u/1.mp4'
    )
    expect(row.publish_at).toBe('2026-08-15')
    expect(row.product_name).toBe('TK 陪跑')
    expect(row.creator_name).toBe('磊哥')
  })
})
