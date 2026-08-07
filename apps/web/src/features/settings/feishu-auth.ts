const FEISHU_AUTHORIZE_URL =
  'https://open.feishu.cn/open-apis/authen/v1/authorize'

export function buildFeishuAuthorizeUrl({
  appId,
  redirectUri,
  state,
}: {
  appId: string
  redirectUri: string
  state: string
}) {
  const url = new URL(FEISHU_AUTHORIZE_URL)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  return url.toString()
}

export function validateFeishuCallback(
  search: string,
  expectedState: string | null
) {
  const params = new URLSearchParams(search)
  const code = params.get('code')?.trim()
  const state = params.get('state')
  if (!code || !state || !expectedState || state !== expectedState) {
    throw new Error('FEISHU_CALLBACK_INVALID')
  }
  return code
}
