export type DataProvider = 'pocketbase' | 'supabase'

export function getDataProvider(): DataProvider {
  const value = import.meta.env.VITE_DATA_PROVIDER || 'supabase'
  if (value !== 'pocketbase' && value !== 'supabase') {
    throw new Error(`不支持的数据提供者：${value}`)
  }
  return value
}

export function getSupabaseEnvironment() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() || "https://mddldiwthvnaefwtlnme.supabase.co"
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "sb_publishable_dvK9zPS9leT2v5n9omM4gA_F0lAOY2w"
  if (!url || !anonKey) throw new Error('Supabase环境变量未配置完整')
  return { url, anonKey }
}
