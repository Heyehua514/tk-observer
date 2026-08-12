/** CSV 导入历史查询与 realtime 刷新。 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { createSupabasePageQuery } from '@/lib/supabase-table'
import { mapImportHistory } from './editing-mappers'
import { mapSupabaseImportHistory } from './editing-supabase-mappers'
import { useEditingRealtime } from './use-editing-realtime'

export const importHistoryKeys = {
  all: ['import-history'] as const,
  list: ['import-history', 'list'] as const,
}

export function useImportHistory() {
  useEditingRealtime('import_history', importHistoryKeys.all)
  return useQuery({
    queryKey: importHistoryKeys.list,
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        return createSupabasePageQuery({
          table: 'import_history',
          page: 1,
          perPage: 20,
          sort: 'imported_at.desc',
          filters: [{ kind: 'is', column: 'deleted_at', value: null }],
          mapRow: mapSupabaseImportHistory,
        })
      }
      const result = await pb
        .collection('import_history')
        .getList(1, 20, { sort: '-imported_at' })
      return { ...result, items: result.items.map(mapImportHistory) }
    },
    placeholderData: keepPreviousData,
  })
}
