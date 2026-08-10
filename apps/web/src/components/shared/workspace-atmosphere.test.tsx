import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { WorkspaceAtmosphere } from './workspace-atmosphere'

it('renders an inert signal rail with reduced-motion fallback metadata', async () => {
  const screen = await render(<WorkspaceAtmosphere />)

  const rail = screen.getByTestId('signal-rail')
  await expect.element(rail).toBeInTheDocument()
  await expect.element(rail).toHaveAttribute('aria-hidden', 'true')
  await expect.element(rail).toHaveAttribute('data-motion', 'ambient')
})
