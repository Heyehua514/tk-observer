const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

function headers() {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length) throw new Error(`missing environment: ${missing.join(', ')}`)
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers(), ...options.headers } })
  const body = await response.text()
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${body.slice(0, 500)}`)
  return body ? JSON.parse(body) : null
}

export async function syncBatch(payload) {
  const [account] = await request(`video_accounts?external_account_id=eq.${encodeURIComponent(payload.account.externalId)}&select=id`)
    .catch(async (error) => {
      if (!String(error.message).includes('404')) throw error
      return []
    })
  const [accountRow] = account ? [account] : await request('video_accounts', {
    method: 'POST',
    body: JSON.stringify({ name: payload.account.name, external_account_id: payload.account.externalId, platform: '微信视频号' }),
  })
  const existingRuns = await request(`video_sync_runs?idempotency_key=eq.${encodeURIComponent(payload.idempotencyKey)}&select=id,status`)
  if (existingRuns?.[0]?.status === 'completed') return { accountId: accountRow.id, runId: existingRuns[0].id, duplicate: true }
  const [run] = existingRuns?.length ? existingRuns : await request('video_sync_runs', {
    method: 'POST',
    body: JSON.stringify({ idempotency_key: payload.idempotencyKey, source: payload.source, status: 'running', total_rows: payload.videos.length }),
  })
  const snapshot = await request('video_account_snapshots?on_conflict=video_account_id,snapshot_date', {
    method: 'POST',
    body: JSON.stringify({ video_account_id: accountRow.id, snapshot_date: payload.snapshot.date, follower_count: payload.snapshot.followerCount }),
  })
  await request('video_ideas?on_conflict=video_account_id,external_video_id', {
    method: 'POST',
    body: JSON.stringify(payload.videos.map((video) => ({
      video_account_id: accountRow.id, external_video_id: video.externalId, sync_source: payload.source,
      last_synced_at: new Date().toISOString(), account: payload.account.name, video_type: video.videoType,
      title: video.title, publish_date: `${video.publishDate}T00:00:00.000Z`, views: video.views, completion_rate: video.completionRate,
      likes: video.likes, comments: video.comments, follower_gain: video.followerGain,
    }))),
  })
  await request(`video_sync_runs?id=eq.${run.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed', finished_at: new Date().toISOString(), inserted_rows: payload.videos.length, updated_rows: payload.videos.length }),
  })
  return { accountId: accountRow.id, runId: run.id, snapshot, syncedVideos: payload.videos.length }
}
