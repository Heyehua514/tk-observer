/** 总览首页：每日情报摘要组件 */
import { Link } from '@tanstack/react-router'
import { Newspaper, ArrowRight, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { useIntelligenceItems } from '@/features/intelligence/hooks/use-intelligence-items'
import type { IntelligenceItem } from '@/features/intelligence/intelligence-model'
import { selectOverviewDigestItems } from './overview-intelligence-model'

export function OverviewIntelligenceDigest() {
  const { data: items = [], isLoading } = useIntelligenceItems({
    query: '',
    workspace: 'all',
    status: 'all',
  })

  const digestItems = selectOverviewDigestItems(items, 4)

  return (
    <Card className='bento-card shadow-none'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Newspaper className='size-4 text-primary' />
          每日情报摘要
        </CardTitle>
        <Button variant='ghost' size='sm' asChild className='h-8 text-xs'>
          <Link to='/intelligence'>
            进入情报中心
            <ArrowRight className='ml-1 size-3' />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {digestItems.length ? (
          <div className='grid gap-3 sm:grid-cols-2'>
            {digestItems.map((item) => (
              <DigestCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={isLoading ? '正在加载最新情报...' : '暂无今日情报'}
            description='团队维护或录入情报后，高热度和最新行业动态将汇聚于此。'
          />
        )}
      </CardContent>
    </Card>
  )
}

function DigestCard({ item }: { item: IntelligenceItem }) {
  return (
    <div className='group flex flex-col justify-between rounded-lg border p-3 text-sm transition-all hover:border-primary/50 hover:bg-muted/30'>
      <div>
        <div className='flex items-start justify-between gap-2'>
          <span className='line-clamp-1 font-medium group-hover:text-primary'>
            {item.title}
          </span>
          <Badge variant='outline' className='shrink-0 text-[10px]'>
            热度 {item.heatScore}
          </Badge>
        </div>
        <p className='mt-1.5 line-clamp-2 text-xs text-muted-foreground'>
          {item.summary || '暂无详细摘要'}
        </p>
      </div>
      <div className='mt-3 flex items-center justify-between text-[11px] text-muted-foreground'>
        <span>{item.sourceName || '公开源'}</span>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-0.5 hover:underline'
            onClick={(e) => e.stopPropagation()}
          >
            原文
            <ExternalLink className='size-2.5' />
          </a>
        ) : (
          <span>{item.capturedAt?.slice(0, 10) || ''}</span>
        )}
      </div>
    </div>
  )
}
