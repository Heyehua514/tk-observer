/** 商务工作台渠道商单本地筛选模型。 */
export type OrderFilterRow = {
  title: string
  clientName: string
  creatorName: string
  status: string
  platform: string
  contentType: string
}

export type OrderFilters = {
  query: string
  status: string
  platform: string
  contentType: string
}

export const emptyOrderFilters: OrderFilters = {
  query: '',
  status: 'all',
  platform: 'all',
  contentType: 'all',
}

export function filterOrders<T extends OrderFilterRow>(
  orders: T[],
  filters: OrderFilters
) {
  const query = filters.query.trim().toLowerCase()
  return orders.filter((order) => {
    const matchesQuery =
      !query ||
      `${order.title} ${order.clientName} ${order.creatorName}`
        .toLowerCase()
        .includes(query)
    return (
      matchesQuery &&
      (filters.status === 'all' || order.status === filters.status) &&
      (filters.platform === 'all' || order.platform === filters.platform) &&
      (filters.contentType === 'all' ||
        order.contentType === filters.contentType)
    )
  })
}
