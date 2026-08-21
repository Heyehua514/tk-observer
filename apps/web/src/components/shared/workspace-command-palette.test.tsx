import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { WorkspaceCommandPalette } from './workspace-command-palette'

const navigate = vi.fn()
const recentPages = vi.hoisted(() => vi.fn(() => ['/editing', '/business']))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))
vi.mock('@/hooks/use-recent-pages', () => ({
  useRecentPages: recentPages,
}))

beforeEach(() => {
  navigate.mockClear()
  recentPages.mockReturnValue([])
})

it.each([
  ['Ctrl', 'Control'],
  ['Cmd', 'Meta'],
] as const)('opens with %s + K and lists existing workspace routes', async (_label, modifier) => {
  const screen = await render(<WorkspaceCommandPalette />)
  await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`)

  await expect.element(screen.getByRole('dialog')).toBeInTheDocument()
  await expect.element(screen.getByText('总览工作台')).toBeInTheDocument()
  await expect.element(screen.getByText('剪辑工作台')).toBeInTheDocument()
  await expect.element(screen.getByText('情报中心')).not.toBeInTheDocument()
})

it('searches recent workspaces and navigates to the selected formal route', async () => {
  recentPages.mockReturnValue(['/editing', '/business', '/intelligence'])
  const screen = await render(<WorkspaceCommandPalette />)
  await userEvent.keyboard('{Control>}k{/Control}')

  await expect.element(screen.getByText('最近访问')).toBeInTheDocument()
  await expect.element(screen.getByText('剪辑工作台').last()).toBeInTheDocument()
  await expect.element(screen.getByText('商务工作台').last()).toBeInTheDocument()
  await expect.element(screen.getByText('情报中心')).not.toBeInTheDocument()

  await userEvent.fill(screen.getByPlaceholder('搜索工作台或功能...'), '商务')
  await userEvent.click(screen.getByText('商务工作台').last())

  expect(navigate).toHaveBeenCalledWith({ to: '/business' })
})
