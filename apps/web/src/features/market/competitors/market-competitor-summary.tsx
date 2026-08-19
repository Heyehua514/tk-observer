/**
 * 竞品监测摘要卡：从共享 competitor_accounts 表读取真实账号并展示前 4 条。
 */
import { useMarketCompetitors } from './use-market-competitors'

export function MarketCompetitorSummary() {
  const competitors = useMarketCompetitors()
  const rows = competitors.data ?? []
  return (
    <>
      <div className='text-xs text-muted-foreground'>竞品监测</div>
      <div className='mt-1 text-lg font-semibold'>{rows.length} 个公众号</div>
      {rows.length ? (
        <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
          {rows.slice(0, 4).map((row) => (
            <div
              key={row.id}
              className='flex items-center justify-between gap-2'
            >
              <span className='truncate'>{row.name}</span>
              <span className='shrink-0 text-xs'>
                {row.category || '未分类'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className='mt-2 text-sm text-muted-foreground'>暂无监测账号</div>
      )}
    </>
  )
}
