import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { FeishuConnectPanel } from './components/feishu-connect-panel'

it('explains the per-user authorization and encrypted-token boundary', async () => {
  const screen = await render(
    <FeishuConnectPanel
      connected={false}
      connectedAt=''
      connecting={false}
      configured
      onConnect={() => undefined}
    />
  )

  await expect
    .element(screen.getByText('每位成员只绑定自己的飞书账号。'))
    .toBeInTheDocument()
  await expect
    .element(screen.getByText('访问令牌加密保存，不通过业务 API 返回。'))
    .toBeInTheDocument()
})
