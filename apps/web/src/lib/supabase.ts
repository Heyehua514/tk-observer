import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnvironment } from '@/lib/data-provider'
import type { Database } from '@/types/database.generated'

let client: SupabaseClient<Database> | undefined

export function getSupabaseClient() {
  if (client) return client
  const { url, anonKey } = getSupabaseEnvironment()
  client = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}
