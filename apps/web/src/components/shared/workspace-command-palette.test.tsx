import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { WorkspaceCommandPalette } from './workspace-command-palette'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

it('opens with Ctrl K and lists existing workspace routes', async () => {
  const screen = await render(<WorkspaceCommandPalette />)
  await userEvent.keyboard('{Control>}k{/Control}')

  await expect.element(screen.getByRole('dialog')).toBeInTheDocument()
  await expect.element(screen.getByText('总览工作台')).toBeInTheDocument()
  await expect.element(screen.getByText('剪辑工作台')).toBeInTheDocument()
})
