import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { Cascader } from './cascader'

function ControlledCascader({
  onValueChange,
}: {
  onValueChange: (value: string[]) => void
}) {
  const [value, setValue] = useState<string[]>([])
  return (
    <Cascader
      aria-label='选择任务'
      options={[
        {
          label: '秋季大促',
          value: 'event-autumn',
          children: [
            {
              label: '招商阶段',
              value: 'phase-sponsor',
              children: [{ label: '确认赞助商', value: 'task-confirm' }],
            },
          ],
        },
      ]}
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue)
        onValueChange(nextValue)
      }}
      placeholder='选择活动任务'
    />
  )
}

it('drills into a hierarchy and returns the selected value path', async () => {
  const onValueChange = vi.fn()
  const screen = await render(
    <ControlledCascader onValueChange={onValueChange} />
  )

  await userEvent.click(screen.getByRole('button', { name: '选择任务' }))
  await userEvent.click(screen.getByRole('option', { name: '秋季大促' }))
  await userEvent.click(screen.getByRole('option', { name: '招商阶段' }))
  await userEvent.click(screen.getByRole('option', { name: '确认赞助商' }))

  expect(onValueChange).toHaveBeenCalledWith([
    'event-autumn',
    'phase-sponsor',
    'task-confirm',
  ])
  await expect
    .element(
      screen.getByRole('button', { name: '秋季大促 / 招商阶段 / 确认赞助商' })
    )
    .toBeInTheDocument()
})
