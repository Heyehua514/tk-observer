/**
 * GMV 指标录入 & 汇总纯函数。
 * 金额以分存储，录入用元；same-date 新记录覆盖旧记录（同一日期只一条）。
 */
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'

export type GmvInput = {
  metricDate: string // YYYY-MM-DD（北京日期）
  amountMinor: number
  currency: 'CNY'
  region: 'US'
}

export async function createGmvMetric(input: GmvInput) {
  const payload = {
    metric_date: new Date(`${input.metricDate}T00:00:00+08:00`).toISOString(),
    amount_minor: input.amountMinor,
    currency: input.currency,
    region: input.region,
  }
  if (getDataProvider() === 'supabase') {
    const supabase = getSupabaseClient()
    // 先清掉同一天已有记录，再插入，保证每天一行（幂等覆盖）
    const { error: delError } = await supabase
      .from('gmv_metrics')
      .update({ deleted_at: new Date().toISOString() })
      .gte(
        'metric_date',
        new Date(`${input.metricDate}T00:00:00+08:00`).toISOString()
      )
      .lte(
        'metric_date',
        new Date(`${input.metricDate}T23:59:59+08:00`).toISOString()
      )
      .is('deleted_at', null)
    if (delError) throw delError
    const { data, error } = await supabase
      .from('gmv_metrics')
      .insert(payload)
      .select('id')
      .single()
    if (error) throw error
    return data
  }
  // PocketBase：先查当天，删除后用新增（同样保证一行）
  const start = new Date(`${input.metricDate}T00:00:00+08:00`).toISOString()
  const end = new Date(`${input.metricDate}T23:59:59+08:00`).toISOString()
  const existing = await pb
    .collection('gmv_metrics')
    .getFullList({
      filter: pb.filter('metric_date >= {:s} && metric_date <= {:e}', {
        s: start,
        e: end,
      }),
    })
  for (const record of existing) {
    await pb.collection('gmv_metrics').delete(record.id)
  }
  return pb.collection('gmv_metrics').create(payload)
}

/** 把一组日期记录汇总为“每 X 天一个值”，用于总览走势图（避免点太多）。 */
export function aggregateGmvByDay(
  records: Array<{ metricDate: string; amountMinor: number }>
): Array<{ date: string; value: number }> {
  return records
    .slice()
    .sort((a, b) => a.metricDate.localeCompare(b.metricDate))
    .map((item) => ({
      date: item.metricDate.slice(5, 10),
      value: item.amountMinor,
    }))
}
