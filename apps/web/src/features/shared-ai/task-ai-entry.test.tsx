import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TaskAiEntry } from './task-ai-entry'

it('emits a read-only task analysis request when clicked', async () => {
  const onSelect = vi.fn()
  const screen = await render(
    <TaskAiEntry
      task={{ title: '跟进客户', status: 'todo', dueAt: '', notes: '确认预算' }}
      onSelect={onSelect}
    />
  )
  await screen.getByRole('button', { name: '分析任务：跟进客户' }).click()
  expect(onSelect).toHaveBeenCalledWith({
    title: '跟进客户',
    status: 'todo',
    dueAt: '',
    notes: '确认预算',
  })
})
