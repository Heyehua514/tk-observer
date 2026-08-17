/** 商务驾驶舱商机阶段更新：统一 Supabase/PocketBase 分支。 */
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
import { opportunityStagePatch, type OpportunityStage } from '../opportunities'

type StageUpdateClient = {
  provider?: 'supabase' | 'pocketbase'
  supabase?: {
    from: (table: 'opportunities') => {
      update: (patch: Record<string, unknown>) => {
        eq: (column: 'id', id: string) => Promise<{ error: unknown }>
      }
    }
  }
}

export async function updateDashboardOpportunityStage(
  client: StageUpdateClient = {},
  input: { id: string; stage: OpportunityStage; lostReason?: string }
) {
  const provider = client.provider || getDataProvider()
  const patch = opportunityStagePatch(input.stage, input.lostReason || '')
  if (provider === 'supabase') {
    const supabase = (client.supabase || getSupabaseClient()) as NonNullable<
      StageUpdateClient['supabase']
    >
    const { error } = await supabase
      .from('opportunities')
      .update({
        ...patch,
        lost_reason: patch.lost_reason || null,
      })
      .eq('id', input.id)
    if (error) throw error
    return
  }
  await pb.collection('opportunities').update(input.id, patch)
}
