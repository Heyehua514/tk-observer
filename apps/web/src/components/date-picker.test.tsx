import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { DatePicker } from './date-picker'

it('exposes the custom accessible name on the trigger', async () => {
  const screen = await render(
    <DatePicker
      selected={undefined}
      onSelect={() => undefined}
      placeholder='选择日期'
      ariaLabel='筛选开始日期'
    />
  )

  await expect
    .element(screen.getByRole('button', { name: '筛选开始日期' }))
    .toBeInTheDocument()
})
