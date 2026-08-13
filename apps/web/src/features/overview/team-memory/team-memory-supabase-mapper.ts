/** 总览团队记忆 Supabase 映射层；权限：boss 只读。 */
import type { TeamMemoryFailedCase } from './types'

type DailyReportLike = {
  date?: unknown
  highlights?: unknown
}

type FailedCaseLike = {
  id?: unknown
  reason?: unknown
  recorded_at?: unknown
}

export function mapSupabaseDailyReport(record: DailyReportLike | null) {
  return {
    dailyHighlight: String(record?.highlights || ''),
    dailyDate: String(record?.date || ''),
  }
}

export function mapSupabaseFailedCase(
  record: FailedCaseLike
): TeamMemoryFailedCase {
  return {
    id: String(record.id || ''),
    reason: String(record.reason || ''),
    recordedAt: String(record.recorded_at || ''),
  }
}
