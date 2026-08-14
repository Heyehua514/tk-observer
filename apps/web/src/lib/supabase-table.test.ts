/** Supabase 分页查询包装自检；保持与现有 ListResult 语义一致。 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks()
})

const select = vi.fn()
const order = vi.fn()
const range = vi.fn()
const is = vi.fn()
const eq = vi.fn()
const or = vi.fn()

const chain = { select, order, range, is, eq, or }
select.mockReturnValue(chain)
is.mockReturnValue(chain)
eq.mockReturnValue(chain)
or.mockReturnValue(chain)
order.mockReturnValue(chain)
range.mockResolvedValue({
  data: [
    { id: '1', name: 'A' },
    { id: '2', name: 'B' },
  ],
  count: 12,
  error: null,
})

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({ select }),
  }),
}))

describe('createSupabasePageQuery', () => {
  it('maps rows and pagination metadata from a Supabase table query', async () => {
    const { createSupabasePageQuery } = await import('./supabase-table')
    const result = await createSupabasePageQuery({
      table: 'clients',
      page: 2,
      perPage: 2,
      sort: 'updated_at.desc',
      filters: [
        { kind: 'is', column: 'deleted_at', value: null },
        { kind: 'eq', column: 'region', value: 'US' },
        { kind: 'or', expression: 'name.ilike.%A%' },
      ],
      mapRow: (row) => ({ id: row.id, name: row.name }),
    })

    expect(select).toHaveBeenCalledWith('*', { count: 'exact' })
    expect(is).toHaveBeenCalledTimes(2)
    expect(is).toHaveBeenNthCalledWith(1, 'deleted_at', null)
    expect(is).toHaveBeenNthCalledWith(2, 'deleted_at', null)
    expect(eq).toHaveBeenCalledWith('region', 'US')
    expect(or).toHaveBeenCalledWith('name.ilike.%A%')
    expect(order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(range).toHaveBeenCalledWith(2, 3)
    expect(result).toEqual({
      page: 2,
      perPage: 2,
      totalItems: 12,
      totalPages: 6,
      items: [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ],
    })
  })

  it('always appends soft-delete filter even without explicit deleted_at filter', async () => {
    const { createSupabasePageQuery } = await import('./supabase-table')
    await createSupabasePageQuery({
      table: 'video_ideas',
      page: 1,
      perPage: 20,
      sort: '-views',
      mapRow: (row) => ({ id: String(row.id) }),
    })
    expect(is).toHaveBeenCalledTimes(1)
    expect(is).toHaveBeenCalledWith('deleted_at', null)
  })
})
