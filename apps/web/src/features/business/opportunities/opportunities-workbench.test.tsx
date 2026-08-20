import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { OpportunitiesWorkbench } from './opportunities-workbench'

const pocketBase = vi.hoisted(() => ({
  create: vi.fn(async (_data: Record<string, unknown>) => ({
    id: 'opportunity-1',
  })),
  getFullList: vi.fn(async () => [
    {
      id: 'opportunity-1',
      title: '玻璃水杯联名合作',
      client: 'client-1',
      expand: { client: { name: '日报测试客户' } },
      amount: 1_000_000,
      stage: 'proposal',
      probability: 60,
      expected_close: '2026-09-01',
      notes: '等待客户确认报价',
    },
  ]),
  update: vi.fn(async () => ({ id: 'opportunity-1' })),
}))

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => pocketBase,
  },
}))

vi.mock('@/lib/data-provider', () => ({
  getDataProvider: () => 'pocketbase',
  getSupabaseEnvironment: () => ({
    url: 'http://127.0.0.1:54321',
    anonKey: 'local-anon-key',
  }),
}))

vi.mock('../clients', () => ({
  useClients: () => ({
    data: [
      {
        id: 'client-1',
        name: '日报测试客户',
        contactName: '张经理',
        contactPhone: '',
        contactWechat: '',
        company: '',
        industry: 'brand',
        source: 'social',
        level: 'A',
        notes: '',
        created: '2026-08-07 00:00:00.000Z',
        updated: '2026-08-07 00:00:00.000Z',
      },
    ],
  }),
}))

it('submits expected amount entered in RMB yuan as integer fen', async () => {
  pocketBase.create.mockClear()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <OpportunitiesWorkbench />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByRole('button', { name: '新增商机' }))
  await expect
    .element(screen.getByText('预计金额（人民币/元）'))
    .toBeInTheDocument()

  const titleInput = document.querySelector<HTMLInputElement>(
    'input[name="title"]'
  )
  expect(titleInput).not.toBeNull()
  await userEvent.fill(titleInput!, '日报自动化测试')
  const clientInput = document.querySelector<HTMLInputElement>(
    'input[name="client"]'
  )
  expect(clientInput).not.toBeNull()
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set
  expect(valueSetter).toBeTypeOf('function')
  valueSetter!.call(clientInput, 'client-1')

  const amountInput = screen.getByRole('spinbutton')
  await userEvent.fill(amountInput, '10000')
  const form = document.querySelector('form')
  expect(form).not.toBeNull()
  form!.dispatchEvent(
    new SubmitEvent('submit', { bubbles: true, cancelable: true })
  )

  await expect
    .poll(() => pocketBase.create.mock.calls[0]?.[0])
    .toMatchObject({
      title: '日报自动化测试',
      client: 'client-1',
      amount: 1_000_000,
      expected_close: '',
      notes: '',
    })
})

it('opens opportunity details in a drawer and saves the edited follow-up note', async () => {
  pocketBase.update.mockClear()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <OpportunitiesWorkbench />
    </QueryClientProvider>
  )

  await expect.element(screen.getByText('玻璃水杯联名合作')).toBeInTheDocument()
  await userEvent.click(screen.getByText('玻璃水杯联名合作'))
  await expect
    .element(screen.getByRole('heading', { name: '玻璃水杯联名合作' }))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('heading', { name: '关联信息' }))
    .toBeInTheDocument()

  const notes = document.querySelector<HTMLTextAreaElement>('textarea')
  expect(notes).not.toBeNull()
  await userEvent.fill(notes!, '客户已确认下周进入合同评审')
  await userEvent.click(screen.getByRole('button', { name: '保存详情' }))

  await expect
    .poll(() => pocketBase.update.mock.calls[0])
    .toEqual([
      'opportunity-1',
      {
        stage: 'proposal',
        expected_close: '2026-09-01 00:00:00.000Z',
        notes: '客户已确认下周进入合同评审',
        lost_reason: '',
        probability: 30,
      },
    ])
})

it('keeps the opportunity card after the detail drawer is closed', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <OpportunitiesWorkbench />
    </QueryClientProvider>
  )

  await userEvent.click(screen.getByText('玻璃水杯联名合作'))
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  await expect.element(screen.getByText('玻璃水杯联名合作')).toBeInTheDocument()
})
