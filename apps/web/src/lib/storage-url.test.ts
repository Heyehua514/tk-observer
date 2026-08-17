/**
 * storage-url 工具自检：数据源回退、批量去重与失败降级。
 * 所属工作台：全局。
 */
import { describe, expect, it, vi } from 'vitest'
import { getDataProvider } from './data-provider'
import {
  resolveStorageUrls,
  signStoragePaths,
  type StorageSigner,
} from './storage-url'

function fakeSigner(impl: {
  data?: Array<{ path: string; signedUrl: string }> | null
  error?: { message: string } | null
}) {
  const createSignedUrls = vi.fn().mockResolvedValue({
    data: impl.data ?? null,
    error: impl.error ?? null,
  })
  const from = vi.fn().mockReturnValue({ createSignedUrls })
  return {
    signer: { storage: { from } } as unknown as StorageSigner,
    from,
    createSignedUrls,
  }
}

describe('signStoragePaths', () => {
  it('批量解析时去重并忽略空路径', async () => {
    const { signer, from, createSignedUrls } = fakeSigner({
      data: [
        { path: 'a.png', signedUrl: 'http://127.0.0.1:54321/signed/a.png' },
        { path: 'b.png', signedUrl: 'http://127.0.0.1:54321/signed/b.png' },
      ],
    })
    await expect(
      signStoragePaths(signer, 'venue-photos', ['a.png', 'a.png', '', '  '])
    ).resolves.toEqual({
      'a.png': 'http://127.0.0.1:54321/signed/a.png',
      'b.png': 'http://127.0.0.1:54321/signed/b.png',
    })
    expect(from).toHaveBeenCalledWith('venue-photos')
    expect(createSignedUrls).toHaveBeenCalledWith(['a.png'], 3600)
  })

  it('空路径列表直接返回，不发请求', async () => {
    const { signer, from } = fakeSigner({})
    await expect(signStoragePaths(signer, 'avatars', [])).resolves.toEqual({})
    expect(from).not.toHaveBeenCalled()
  })

  it('签名失败时返回空映射而不是抛错', async () => {
    const { signer } = fakeSigner({ error: { message: 'denied' } })
    await expect(
      signStoragePaths(signer, 'finance-receipts', ['r.png'])
    ).resolves.toEqual({})
  })
})

describe('resolveStorageUrls', () => {
  it('Supabase 未启用时返回空映射且不访问客户端', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'pocketbase')
    expect(getDataProvider()).toBe('pocketbase')
    await expect(
      resolveStorageUrls('design-assets', ['a.png'])
    ).resolves.toEqual({})
    vi.unstubAllEnvs()
  })
})
