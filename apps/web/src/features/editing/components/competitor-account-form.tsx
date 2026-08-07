/** 对标账号资料编辑表单：维护主页、粉丝数、均播和备注。 */
import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateCompetitorAccount } from '../hooks/use-competitor-accounts'
import type { CompetitorAccount } from '../types'

const schema = z.object({
  profileUrl: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\//u.test(value), '请输入有效链接'),
  followerCount: z.number().int().min(0),
  averageViews: z.number().int().min(0),
  notes: z.string().trim().max(5000),
})
type Values = z.infer<typeof schema>

export function CompetitorAccountForm({
  account,
  open,
  onOpenChange,
}: {
  account: CompetitorAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateAccount = useUpdateCompetitorAccount()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      profileUrl: '',
      followerCount: 0,
      averageViews: 0,
      notes: '',
    },
  })
  useEffect(() => {
    if (account)
      form.reset({
        profileUrl: account.profileUrl,
        followerCount: account.followerCount,
        averageViews: account.averageViews,
        notes: account.notes,
      })
  }, [account, form, open])
  if (!account) return null
  const submit = async (values: Values) => {
    await updateAccount.mutateAsync({ id: account.id, ...values })
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑 {account.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name='profileUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>视频号主页链接</FormLabel>
                  <FormControl>
                    <Input type='url' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='followerCount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>粉丝数</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='averageViews'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>平均播放量</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账号备注</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={updateAccount.isPending}>
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
