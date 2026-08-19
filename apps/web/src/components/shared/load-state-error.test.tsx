import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { LoadStateError } from './load-state-error'

it('shows title, description and triggers retry', async () => {
  const onRetry = vi.fn()
  const screen = await render(
    <LoadStateError title='选题数据加载失败' onRetry={onRetry} />
  )
  await expect.element(screen.getByText('选题数据加载失败')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '重新加载' }))
  expect(onRetry).toHaveBeenCalledTimes(1)
})

it('renders without a retry button when none is provided', async () => {
  const screen = await render(<LoadStateError description='请稍后重试' />)
  await expect.element(screen.getByText('数据暂时无法加载')).toBeInTheDocument()
  expect(document.querySelector('button')).toBeNull()
})
