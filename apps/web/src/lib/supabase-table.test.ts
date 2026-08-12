/** Supabase 分页查询包装自检；保持与现有 ListResult 语义一致。 */
import { describe, expect, it, vi } from 'vitest'

const select = vi.fn()
const order = vi.fn()
const range = vi.fn()
const is = vi.fn()
const eq = vi.fn()
const or = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select,
      order,
      range,
      is,
      eq,
      or,
    }),
  }),
}))

describe('createSupabasePageQuery', () => {
  it('maps rows and pagination metadata from a Supabase table query', async () => {
    select.mockReturnValue({
      is,
    })
    is.mockReturnValue({
      eq,
    })
    eq.mockReturnValue({
      or,
    })
    or.mockReturnValue({
      order,
    })
    order.mockReturnValue({
      range,
    })
    range.mockResolvedValue({
      data: [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ],
      count: 12,
      error: null,
    })

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
    expect(is).toHaveBeenCalledWith('deleted_at', null)
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
})
