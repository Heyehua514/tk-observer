import { describe, expect, it } from 'vitest'
import { getClientUpdateSurface } from './client-update-model'

describe('client update surface', () => {
  it('explains the web refresh behavior outside desktop', () => {
    expect(getClientUpdateSurface(false, false)).toMatchObject({
      enabled: false,
      actionLabel: '网页端已自动更新',
    })
  })

  it('does not expose a fake updater before the signed service is configured', () => {
    expect(getClientUpdateSurface(true, false)).toMatchObject({
      enabled: false,
      actionLabel: '更新服务配置中',
    })
  })

  it('enables the check action only for configured desktop clients', () => {
    expect(getClientUpdateSurface(true, true)).toMatchObject({
      enabled: true,
      actionLabel: '检查更新',
    })
  })
})
