import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MetricDeck } from './metric-deck'

vi.mock('framer-motion', async (importOriginal) => {
  const original = await importOriginal<typeof import('framer-motion')>()
  return { ...original, useReducedMotion: () => true }
})

it('removes entrance movement when reduced motion is requested', async () => {
  const screen = await render(
    <MetricDeck aria-label='减弱动效指标'>
      <div>静态指标</div>
    </MetricDeck>
  )

  const motionCard = screen.getByTestId('metric-motion-0')
  await expect.element(motionCard).toHaveAttribute('data-motion', 'reduced')
  await expect.element(motionCard).toHaveStyle({
    opacity: '1',
    transform: 'none',
  })
})
