/**
 * Storage 签名 URL 解析：Supabase-first，把私有 bucket 路径解析为带时效的签名 URL。
 * 所属工作台：全局（设计素材 / 场地照片 / 活动物料 / 财务凭证共用）。
 * 权限：仅发起签名请求，不提升权限；读写权限由 storage RLS 按角色控制。
 */
import { getDataProvider } from './data-provider'
import { getSupabaseClient } from './supabase'

export const STORAGE_URL_TTL_SECONDS = 3600

export type StorageSigner = {
  storage: {
    from(bucket: string): {
      createSignedUrls(
        paths: string[],
        expiresIn: number
      ): Promise<{
        data: Array<{
          path: string | null
          signedUrl: string | null
        }> | null
        error: { message: string } | null
      }>
    }
  }
}

/**
 * 批量解析私有文件为签名 URL（path -> signedUrl）。
 * 解析失败时返回空对象（不抛错），调用方应降级为隐藏预览入口。
 */
export async function signStoragePaths(
  client: StorageSigner,
  bucket: string,
  paths: string[]
): Promise<Record<string, string>> {
  const unique = [
    ...new Set(paths.map((p) => String(p || '').trim()).filter(Boolean)),
  ]
  if (unique.length === 0) return {}
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrls(unique, STORAGE_URL_TTL_SECONDS)
  if (error) return {}
  const entries: Array<[string, string]> = []
  for (const item of data || []) {
    if (item.path && item.signedUrl) entries.push([item.path, item.signedUrl])
  }
  return Object.fromEntries(entries)
}

/**
 * Supabase 数据源下的入口：内部直接使用当前客户端。
 */
export async function resolveStorageUrls(
  bucket: string,
  paths: string[]
): Promise<Record<string, string>> {
  if (getDataProvider() !== 'supabase') return {}
  return signStoragePaths(getSupabaseClient(), bucket, paths)
}
