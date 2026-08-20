import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { AnchorNavigation } from './anchor-navigation'

it('renders semantic section links and scrolls the selected section into view', async () => {
  const scrollIntoView = vi.fn()
  const section = document.createElement('section')
  section.id = 'action-queue'
  section.scrollIntoView = scrollIntoView
  document.body.append(section)

  const screen = await render(
    <AnchorNavigation
      label='总览目录'
      items={[
        { id: 'metrics', label: '核心指标' },
        { id: 'action-queue', label: '行动队列' },
      ]}
    />
  )

  await expect
    .element(screen.getByRole('navigation', { name: '总览目录' }))
    .toBeInTheDocument()
  await userEvent.click(screen.getByRole('link', { name: '行动队列' }))

  expect(scrollIntoView).toHaveBeenCalledWith({
    behavior: 'smooth',
    block: 'start',
  })
  section.remove()
})
