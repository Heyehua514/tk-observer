import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { MetricDeck } from './metric-deck'

it('groups business metrics in an accessible motion deck', async () => {
  const screen = await render(
    <MetricDeck aria-label='经营指标'>
      <div>客户</div>
      <div>商机</div>
    </MetricDeck>
  )

  const deck = screen.getByRole('region', { name: '经营指标' })
  await expect.element(deck).toHaveAttribute('data-kpi-deck', 'true')
  await expect.element(screen.getByText('客户')).toBeInTheDocument()
  await expect.element(screen.getByText('商机')).toBeInTheDocument()
})
