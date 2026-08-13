// 商务工作台活动招商协作面板；权限：business 只更新跟进阶段，market 与 boss 管理完整记录。
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDataProvider } from '@/lib/data-provider'
import { pb } from '@/lib/pocketbase'
import { getSupabaseClient } from '@/lib/supabase'
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
import { mapSponsorshipRecord } from './sponsorship-mapper'

const stages = [
  ['intent', '意向'],
  ['negotiating', '洽谈中'],
  ['signed', '已签约'],
  ['lost', '已流失'],
] as const
export function SponsorshipsWorkbench() {
  const cache = useQueryClient()
  const records = useQuery({
    queryKey: ['business', 'sponsorships'],
    queryFn: async () => {
      if (getDataProvider() === 'supabase') {
        const { data, error } = await getSupabaseClient()
          .from('event_sponsorships')
          .select('*, events(name), clients(name)')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data || []).map(mapSponsorshipRecord)
      }
      return (
        await pb
          .collection('event_sponsorships')
          .getFullList({ sort: '-updated', expand: 'event,client' })
      ).map(mapSponsorshipRecord)
    },
  })
  const update = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      if (getDataProvider() === 'supabase') {
        const { error } = await getSupabaseClient()
          .from('event_sponsorships')
          .update({ stage })
          .eq('id', id)
        if (error) throw error
        return
      }
      await pb.collection('event_sponsorships').update(id, { stage })
    },
    onSuccess: () =>
      void cache.invalidateQueries({ queryKey: ['business', 'sponsorships'] }),
  })
  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>活动</TableHead>
            <TableHead>赞助公司</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>对接人</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.data?.map((item) => (
            <TableRow key={item.id}>
              <TableCell className='font-medium'>{item.eventName}</TableCell>
              <TableCell>{item.company}</TableCell>
              <TableCell>¥{(item.amount / 100).toLocaleString()}</TableCell>
              <TableCell>
                <Select
                  value={item.stage}
                  onValueChange={(stage) =>
                    update.mutate({ id: item.id, stage })
                  }
                >
                  <SelectTrigger className='w-28'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(([value, label]) => (
                      <SelectItem value={value} key={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{item.contact}</TableCell>
            </TableRow>
          ))}
          {!records.isLoading && !records.data?.length && (
            <TableRow>
              <TableCell
                colSpan={5}
                className='h-32 text-center text-muted-foreground'
              >
                暂无活动招商记录
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
