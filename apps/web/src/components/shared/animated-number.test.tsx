import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { AnimatedNumber } from './animated-number'

it('exposes the final value while the visible number animates', async () => {
  const screen = await render(
    <AnimatedNumber value={1280} format={(value) => `${value} 个`} />
  )

  await expect.element(screen.getByLabelText('1280 个')).toBeInTheDocument()
  await expect.element(screen.getByText('1280 个')).toBeInTheDocument()
})
