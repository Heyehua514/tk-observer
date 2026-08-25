import { describe, expect, it, vi } from 'vitest'
import { checkForDesktopUpdate } from './desktop-updater-actions'

describe('desktop updater actions', () => {
  it('reports when the release feed has no newer version', async () => {
    const check = vi.fn().mockResolvedValue(null)

    await expect(checkForDesktopUpdate({ check })).resolves.toEqual({
      state: 'current',
      message: '当前已是最新版本',
    })
  })

  it('downloads and installs a discovered update before relaunching', async () => {
    const relaunch = vi.fn().mockResolvedValue(undefined)
    const downloadAndInstall = vi.fn().mockResolvedValue(undefined)
    const check = vi
      .fn()
      .mockResolvedValue({ version: '0.1.1', downloadAndInstall })

    await expect(checkForDesktopUpdate({ check, relaunch })).resolves.toEqual({
      state: 'updated',
      version: '0.1.1',
      message: '已安装 0.1.1，正在重启客户端',
    })
    expect(downloadAndInstall).toHaveBeenCalledOnce()
    expect(relaunch).toHaveBeenCalledOnce()
  })

  it('returns a user-facing error when the release feed fails', async () => {
    const check = vi.fn().mockRejectedValue(new Error('network'))

    await expect(checkForDesktopUpdate({ check })).resolves.toEqual({
      state: 'error',
      message: '检查更新失败，请稍后重试',
    })
  })
})
