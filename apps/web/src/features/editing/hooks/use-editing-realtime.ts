/** 剪辑工作台通用实时订阅：collection 变化时只失效对应 Query key。 */
import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'

export function useEditingRealtime(collection: string, queryKey: QueryKey) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (getDataProvider() === 'supabase') return
    let unsubscribe: (() => void) | undefined
    let disposed = false
    void pb
      .collection(collection)
      .subscribe('*', () => {
        void queryClient.invalidateQueries({ queryKey })
      })
      .then((stop) => {
        if (disposed) void stop()
        else unsubscribe = stop
      })
    return () => {
      disposed = true
      if (unsubscribe) void unsubscribe()
    }
  }, [collection, queryClient, queryKey])
}
