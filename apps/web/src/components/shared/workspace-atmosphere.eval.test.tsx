import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { WorkspaceAtmosphere } from './workspace-atmosphere'

it('keeps the ambient layer out of the interaction tree', async () => {
  const screen = await render(<WorkspaceAtmosphere />)
  const rail = screen.getByTestId('signal-rail')

  await expect.element(rail).toHaveAttribute('aria-hidden', 'true')
  await expect.element(rail).toHaveClass('pointer-events-none')
})
