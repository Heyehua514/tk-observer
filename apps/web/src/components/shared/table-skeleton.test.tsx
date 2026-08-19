import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { TableSkeleton } from './table-skeleton'

it('renders a skeleton table with the given accessibility label', async () => {
  const screen = await render(
    <TableSkeleton title='正在加载选题' rows={2} columns={3} />
  )
  await expect
    .element(screen.getByRole('status', { name: '正在加载选题' }))
    .toBeInTheDocument()
})

it('defaults to 4 rows x 5 columns', async () => {
  const screen = await render(<TableSkeleton />)
  await expect
    .element(screen.getByRole('status', { name: '正在加载数据' }))
    .toBeInTheDocument()
})
