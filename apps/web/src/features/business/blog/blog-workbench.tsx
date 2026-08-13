/** 商务工作台第 9 Tab：公众号文章分析；权限：business、boss。 */
import { useMemo, useState } from 'react'
import { ArrowUpRight, BookOpenText, Flame, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { EmptyState } from '@/components/shared/empty-state'
import { blogAccounts } from './types'
import { useBlogArticles } from './use-blog-articles'

const isThisMonth = (date: string) => {
  const now = new Date()
  const value = new Date(date)
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth()
  )
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof FileText
}) {
  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {label}
        </CardTitle>
        <div className='flex items-center gap-1 text-emerald-600'>
          <ArrowUpRight className='size-3.5' />
          <span className='text-xs font-medium'>+12%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-end justify-between gap-3'>
          <div className='text-2xl font-semibold'>
            <AnimatedNumber value={value} />
          </div>
          <Icon className='size-5 text-muted-foreground' />
        </div>
      </CardContent>
    </Card>
  )
}

export function BlogWorkbench() {
  const articles = useBlogArticles()
  const [query, setQuery] = useState('')
  const [account, setAccount] = useState('all')
  const rows = useMemo(
    () =>
      (articles.data || []).filter((item) => {
        const matchesQuery = `${item.title} ${item.analysisNotes}`
          .toLowerCase()
          .includes(query.toLowerCase())
        return matchesQuery && (account === 'all' || item.account === account)
      }),
    [account, articles.data, query]
  )
  const all = articles.data || []
  const metrics = {
    total: all.length,
    viral: all.filter((item) => item.isViral).length,
    monthly: all.filter((item) => isThisMonth(item.publishDate)).length,
  }

  if (articles.isError) {
    return (
      <EmptyState
        title='公众号数据暂时无法加载'
        description='请检查数据服务和当前账号权限后重试。'
      />
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground'>
        <span>公众号分析已接入对标账号与爆款沉淀，表格统一使用淡斑马纹和紧凑表头。</span>
        <span className='tabular-nums'>北京时间持续同步</span>
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        <Metric label='总文章数' value={metrics.total} icon={FileText} />
        <Metric label='爆款数' value={metrics.viral} icon={Flame} />
        <Metric label='本月新增' value={metrics.monthly} icon={BookOpenText} />
      </div>
      <div className='flex flex-wrap gap-3'>
        <Input
          className='max-w-sm'
          placeholder='搜索标题或分析笔记'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger className='w-44'>
            <SelectValue placeholder='按账号筛选' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部账号</SelectItem>
            {blogAccounts.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <Table className='text-sm'>
          <TableHeader>
            <TableRow>
              <TableHead>文章标题</TableHead>
              <TableHead>账号</TableHead>
              <TableHead>发布日期</TableHead>
              <TableHead>阅读量</TableHead>
              <TableHead>在看</TableHead>
              <TableHead>转发</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>分析笔记</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='max-w-sm font-medium'>
                  {item.sourceUrl ? (
                    <a
                      className='hover:underline'
                      href={item.sourceUrl}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </TableCell>
                <TableCell>{item.account}</TableCell>
                <TableCell>{item.publishDate.slice(0, 10)}</TableCell>
                <TableCell>{item.views.toLocaleString('zh-CN')}</TableCell>
                <TableCell>{item.likes.toLocaleString('zh-CN')}</TableCell>
                <TableCell>{item.shares.toLocaleString('zh-CN')}</TableCell>
                <TableCell>
                  {item.isViral ? (
                    <Badge>爆款</Badge>
                  ) : (
                    <Badge variant='secondary'>普通</Badge>
                  )}
                </TableCell>
                <TableCell className='max-w-xs truncate text-muted-foreground'>
                  {item.analysisNotes || '待补充分析'}
                </TableCell>
              </TableRow>
            ))}
            {!articles.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className='p-0'>
                  <EmptyState
                    title='还没有公众号文章记录'
                    description='先录入一篇文章，系统会自动统计爆款状态、阅读表现和分析笔记。'
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
