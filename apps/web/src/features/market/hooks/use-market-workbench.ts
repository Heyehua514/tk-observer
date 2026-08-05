/** 市场工作台搜索状态 hook，为选品库 CRUD 接入做准备。 */
import { useMemo } from 'react'

export function useMarketWorkbench(query: string) {
  return useMemo(() => query.trim(), [query])
}
