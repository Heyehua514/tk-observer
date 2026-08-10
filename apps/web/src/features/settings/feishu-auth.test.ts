import { describe, expect, it } from 'vitest'
import { buildFeishuAuthorizeUrl, validateFeishuCallback } from './feishu-auth'

describe('buildFeishuAuthorizeUrl', () => {
  it('builds the Feishu v1 authorization URL with encoded callback state', () => {
    const url = new URL(
      buildFeishuAuthorizeUrl({
        appId: 'cli_test',
        redirectUri: 'http://localhost:5173/settings/feishu',
        state: 'state value',
      })
    )

    expect(url.origin + url.pathname).toBe(
      'https://open.feishu.cn/open-apis/authen/v1/authorize'
    )
    expect(url.searchParams.get('app_id')).toBe('cli_test')
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:5173/settings/feishu'
    )
    expect(url.searchParams.get('state')).toBe('state value')
  })
})

describe('validateFeishuCallback', () => {
  it('returns the authorization code only when state matches', () => {
    expect(
      validateFeishuCallback('?code=code-1&state=state-1', 'state-1')
    ).toBe('code-1')
  })

  it.each([
    ['?code=code-1&state=wrong', 'state-1'],
    ['?code=&state=state-1', 'state-1'],
    ['?code=code-1', 'state-1'],
  ])('rejects invalid callback data', (search, expectedState) => {
    expect(() => validateFeishuCallback(search, expectedState)).toThrow()
  })
})
