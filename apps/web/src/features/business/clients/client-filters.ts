/** 商务工作台客户本地筛选模型；页面筛选控件与列表共用。 */
import type { Client } from './types'

export type ClientFilters = {
  query: string
  industry: string
  source: string
  level: string
}

export const emptyClientFilters: ClientFilters = {
  query: '',
  industry: 'all',
  source: 'all',
  level: 'all',
}

export function filterClients(clients: Client[], filters: ClientFilters) {
  const query = filters.query.trim().toLowerCase()
  return clients.filter((client) => {
    const matchesQuery =
      !query ||
      `${client.name} ${client.contactName} ${client.company}`
        .toLowerCase()
        .includes(query)
    return (
      matchesQuery &&
      (filters.industry === 'all' || client.industry === filters.industry) &&
      (filters.source === 'all' || client.source === filters.source) &&
      (filters.level === 'all' || client.level === filters.level)
    )
  })
}
