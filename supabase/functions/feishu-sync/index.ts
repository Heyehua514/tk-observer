/**
 * 飞书文档同步；权限：仅 cron secret/service_role；用途：按成员游标增量同步，不向客户端返回 token。
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { decryptToken, requireSyncConfig, syncSource } from './core.mjs'

type SyncItem = Record<string, unknown>
type SyncPage = { items: SyncItem[]; nextCursor: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}
const sourceTypes = ['doc', 'wiki', 'bitable'] as const

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeItem(item: Record<string, unknown>, sourceType: string) {
  const token = String(item.docs_token || item.doc_token || item.obj_token || item.token || '')
  return {
    source_type: sourceType,
    source_url: String(item.url || item.source_url || (token ? `https://open.feishu.cn/${sourceType}/${token}` : '')),
    source_title: String(item.title || item.name || ''),
    raw_content: String(item.raw_content || item.content || item.summary || '').slice(0, 50000),
    author_name: String(item.owner_name || item.author_name || ''),
    feishu_updated_at: item.update_time || item.updated_at || item.modified_time || null,
    access_scope: String(item.access_scope || 'internal'),
    sync_status: 'pending',
    synced_at: new Date().toISOString(),
  }
}

async function fetchPage(accessToken: string, sourceType: string, cursor: string) {
  const response = await fetch('https://open.feishu.cn/open-apis/suite/docs-api/search/object', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      search_key: '',
      count: 50,
      offset: cursor ? Number(cursor) : 0,
      docs_types: sourceType === 'doc' ? ['doc', 'docx'] : [sourceType],
    }),
  })
  const body = await response.json()
  if (!response.ok || Number(body.code || 0) !== 0) throw new Error('FEISHU_PAGE_REQUEST_FAILED')
  const data = body.data || body
  const rawItems = data.docs_entities || data.items || data.files || []
  return {
    items: rawItems.map((item: Record<string, unknown>) => normalizeItem(item, sourceType)).filter((item: { source_url: string }) => item.source_url),
    nextCursor: data.has_more ? String(data.next_cursor || data.page_token || (cursor ? Number(cursor) : 0) + 50) : '',
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const expectedSecret = Deno.env.get('FEISHU_SYNC_SECRET') || ''
  if (!expectedSecret || request.headers.get('x-cron-secret') !== expectedSecret) {
    return json({ code: 'SYNC_AUTH_REQUIRED' }, 401)
  }
  if (request.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED' }, 405)

  let config
  try {
    config = requireSyncConfig(Deno.env.toObject())
  } catch {
    return json({ code: 'SYNC_NOT_CONFIGURED' }, 503)
  }
  const { supabaseUrl, serviceRoleKey, encryptionKey } = config

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const { data: connections, error } = await admin
    .from('feishu_connections')
    .select('user_id,access_token_encrypted,sync_enabled,last_synced_at,consecutive_failures')
    .eq('sync_enabled', true)
  if (error) return json({ code: 'SYNC_CONNECTIONS_READ_FAILED' }, 502)

  const summary = { users: 0, sources: 0, documents: 0, failures: 0, disabled: 0 }
  for (const connection of connections || []) {
    summary.users += 1
    try {
      const accessToken = await decryptToken(connection.access_token_encrypted, encryptionKey)
      for (const sourceType of sourceTypes) {
        const { data: state } = await admin
          .from('feishu_sync_state')
          .select('id,last_cursor')
          .eq('user_id', connection.user_id)
          .eq('source_type', sourceType)
          .maybeSingle()
        const result = await syncSource({
          initialCursor: state?.last_cursor || '',
          fetchPage: (cursor: string): Promise<SyncPage> => fetchPage(accessToken, sourceType, cursor),
          upsert: async (items: SyncItem[]) => {
            const { error: upsertError } = await admin.from('feishu_documents').upsert(
              items.map((item: SyncItem) => ({ ...item, owner_user: connection.user_id })),
              { onConflict: 'owner_user,source_url' }
            )
            if (upsertError) throw new Error('FEISHU_DOCUMENTS_WRITE_FAILED')
          },
          saveCursor: async (cursor: string) => {
            const { error: cursorError } = await admin.from('feishu_sync_state').upsert({
              user_id: connection.user_id,
              source_type: sourceType,
              last_cursor: cursor,
              last_synced_at: new Date().toISOString(),
              consecutive_failures: 0,
            }, { onConflict: 'user_id,source_type' })
            if (cursorError) throw new Error('FEISHU_CURSOR_WRITE_FAILED')
          },
        })
        summary.sources += 1
        summary.documents += result.synced
      }
      const { error: successError } = await admin.from('feishu_connections').update({
        last_synced_at: new Date().toISOString(),
        consecutive_failures: 0,
      }).eq('user_id', connection.user_id)
      if (successError) throw new Error('FEISHU_CONNECTION_UPDATE_FAILED')
    } catch (syncError) {
      const failures = Number(connection.consecutive_failures || 0) + 1
      const disabled = failures >= 5
      summary.failures += 1
      if (disabled) summary.disabled += 1
      await admin.from('feishu_connections').update({
        consecutive_failures: failures,
        sync_enabled: !disabled,
      }).eq('user_id', connection.user_id)
      console.error(JSON.stringify({ event: 'feishu_sync_failed', userId: connection.user_id, message: String(syncError) }))
    }
  }
  return json(summary)
})
