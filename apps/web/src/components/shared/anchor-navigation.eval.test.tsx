import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { AnchorNavigation } from './anchor-navigation'

it('exposes the current section after a workspace user changes the page anchor', async () => {
  const section = document.createElement('section')
  section.id = 'review'
  section.scrollIntoView = () => undefined
  document.body.append(section)

  const screen = await render(
    <AnchorNavigation
      label='设计需求目录'
      items={[
        { id: 'brief', label: '需求说明' },
        { id: 'review', label: '审核记录' },
      ]}
    />
  )

  await userEvent.click(screen.getByRole('link', { name: '审核记录' }))
  await expect
    .element(screen.getByRole('link', { name: '审核记录' }))
    .toHaveAttribute('aria-current', 'location')

  section.remove()
})
