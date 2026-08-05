/** 剪辑工作台搜索状态 hook，后续视频任务 CRUD 复用。 */
import { useMemo } from 'react'

export function useEditingWorkbench(query: string) {
  return useMemo(() => query.trim(), [query])
}
