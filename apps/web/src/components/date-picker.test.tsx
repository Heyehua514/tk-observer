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

it('uses Chinese date text by default', async () => {
  const screen = await render(
    <DatePicker
      selected={new Date('2026-08-21T00:00:00')}
      onSelect={() => undefined}
    />
  )

  await expect
    .element(screen.getByRole('button', { name: '选择日期' }))
    .toHaveTextContent('2026年8月21日')
})
