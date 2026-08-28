import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { FilterBar } from './filter-bar'

it('keeps reset action usable when filters wrap on mobile', async () => {
  const screen = await render(
    <FilterBar onReset={() => undefined}>
      <span>筛选条件</span>
    </FilterBar>
  )

  const reset = screen.getByRole('button', { name: '重置' })
  await expect.element(reset).toHaveClass('w-full')
  await expect.element(reset).toHaveClass('sm:w-auto')
})
