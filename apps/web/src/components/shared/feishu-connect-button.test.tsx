import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { FeishuConnectButton } from './feishu-connect-button'

it('shows connection state and invokes the connection command', async () => {
  const onConnect = vi.fn()
  const screen = await render(
    <FeishuConnectButton connected={false} onConnect={onConnect} />
  )

  await userEvent.click(screen.getByRole('button', { name: '连接飞书账号' }))
  expect(onConnect).toHaveBeenCalledOnce()
})

it('does not offer a second connection while the account is connected', async () => {
  const screen = await render(
    <FeishuConnectButton connected onConnect={() => undefined} />
  )

  await expect
    .element(screen.getByRole('button', { name: '飞书账号已连接' }))
    .toBeDisabled()
})
