import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { MetricDeck } from './metric-deck'

it('uses a named region instead of making animation the only hierarchy signal', async () => {
  const screen = await render(
    <MetricDeck aria-label='核心数据'>
      <div>1</div>
    </MetricDeck>
  )

  await expect
    .element(screen.getByRole('region', { name: '核心数据' }))
    .toBeInTheDocument()
})
