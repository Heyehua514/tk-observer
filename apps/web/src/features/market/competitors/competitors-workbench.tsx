/** 市场工作台竞品监测面板；权限：market、boss 只读。 */
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadStateError } from '@/components/shared/load-state-error'
import { useMarketCompetitors } from './use-market-competitors'

const numberText = (value: number) => value.toLocaleString('zh-CN')

export function CompetitorsWorkbench({ query = '' }: { query?: string }) {
  const competitors = useMarketCompetitors(query)
  const rows = competitors.data ?? []

  if (competitors.isError) {
    return (
      <LoadStateError
        title='竞品数据暂时无法加载'
        description='请检查数据服务和当前角色权限。'
        onRetry={() => void competitors.refetch()}
      />
    )
  }

  if (!competitors.isLoading && rows.length === 0) {
    return (
      <EmptyState
        title='还没有竞品账号'
        description='先在剪辑或商务工作台维护对标账号，市场侧会同步显示。'
      />
    )
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-3'>
        <Metric label='监测账号' value={`${rows.length} 个`} />
        <Metric
          label='账号均播'
          value={numberText(
            rows.length
              ? Math.round(
                  rows.reduce((sum, row) => sum + row.averageViews, 0) /
                    rows.length
                )
              : 0
          )}
        />
        <Metric
          label='已补主页'
          value={`${rows.filter((row) => row.profileUrl).length} 个`}
        />
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>账号</TableHead>
              <TableHead>平台</TableHead>
              <TableHead>类别</TableHead>
              <TableHead>粉丝数</TableHead>
              <TableHead>均播</TableHead>
              <TableHead>观察备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    {row.profileUrl ? (
                      <a
                        className='inline-flex items-center gap-1 hover:text-primary hover:underline'
                        href={row.profileUrl}
                        target='_blank'
                        rel='noreferrer'
                      >
                        {row.name}
                        <ExternalLink className='size-3' />
                      </a>
                    ) : (
                      row.name
                    )}
                  </div>
                </TableCell>
                <TableCell>{row.platform || '-'}</TableCell>
                <TableCell>
                  <Badge variant='secondary'>{row.category || '未分类'}</Badge>
                </TableCell>
                <TableCell>{numberText(row.followerCount)}</TableCell>
                <TableCell>{numberText(row.averageViews)}</TableCell>
                <TableCell className='max-w-sm truncate text-muted-foreground'>
                  {row.notes || '等待补充观察结论'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 text-xl font-semibold'>{value}</div>
    </div>
  )
}
