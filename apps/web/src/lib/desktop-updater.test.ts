import { describe, expect, it } from 'vitest'
import {
  getDesktopUpdaterConfig,
  getDesktopUpdaterStatus,
  type DesktopUpdaterEnvironment,
} from './desktop-updater'

describe('desktop updater configuration', () => {
  it('reports missing release configuration instead of claiming the app is current', () => {
    const environment: DesktopUpdaterEnvironment = {
      endpoint: '',
      publicKey: '',
      currentVersion: '0.1.0',
    }

    expect(getDesktopUpdaterConfig(environment)).toEqual({
      configured: false,
      missing: ['endpoint', 'publicKey'],
      currentVersion: '0.1.0',
    })
    expect(getDesktopUpdaterStatus(environment)).toEqual({
      state: 'not-configured',
      message: '桌面端更新服务尚未配置',
    })
  })

  it('returns ready when endpoint and signing key are present', () => {
    const environment: DesktopUpdaterEnvironment = {
      endpoint: 'https://updates.example.com/latest.json',
      publicKey: 'ed25519-public-key',
      currentVersion: '0.1.0',
    }

    expect(getDesktopUpdaterStatus(environment)).toEqual({
      state: 'ready',
      message: '桌面端更新服务已就绪',
    })
  })
})
