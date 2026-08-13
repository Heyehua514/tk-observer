/** 达人批量状态更新：统一 Supabase/PocketBase 分支。 */
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import type { CooperationStatus } from '../types'

type BulkUpdateClient = {
  provider?: 'supabase' | 'pocketbase'
  supabase?: {
    from: (table: 'creators') => {
      update: (payload: { cooperation_status: CooperationStatus }) => {
        in: (
          column: 'id',
          values: string[]
        ) => Promise<{ error: unknown }>
      }
    }
  }
}

export async function bulkUpdateCreatorStatus(
  client: BulkUpdateClient = {},
  input: { ids: string[]; status: CooperationStatus }
) {
  if (!input.ids.length) return
  const provider = client.provider || getDataProvider()
  if (provider === 'supabase') {
    const supabase = (client.supabase ||
      getSupabaseClient()) as NonNullable<BulkUpdateClient['supabase']>
    const { error } = await supabase
      .from('creators')
      .update({ cooperation_status: input.status })
      .in('id', input.ids)
    if (error) throw error
    return
  }
  await Promise.all(
    input.ids.map((id) =>
      pb.collection('creators').update(id, {
        cooperation_status: input.status,
      })
    )
  )
}
