/** owner 成员邀请卡；邀请只按邮箱生效，角色由 owner 在邀请时指定。 */
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getDataProvider } from '@/lib/data-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { LoadStateError } from '@/components/shared/load-state-error'
import { useMemberInvitations } from '../hooks/use-member-invitations'
import {
  getEffectiveInvitationStatus,
  getInvitationActions,
  invitationRoles,
  type InvitationRole,
  type MemberInvitation,
} from '../member-invitations'

const invitationSchema = z.object({
  name: z.string().trim().min(1, '请输入成员姓名').max(80, '姓名最多 80 字'),
  email: z.string().trim().min(1, '请输入邮箱').email('请输入有效邮箱'),
  role: z.enum(invitationRoles),
})

type InvitationValues = z.infer<typeof invitationSchema>

const roleLabels: Record<InvitationRole, string> = {
  boss: '老板',
  business: '商务',
  market: '市场',
  design: '设计',
  editing: '剪辑',
}

const statusLabels: Record<MemberInvitation['status'], string> = {
  invited: '待使用',
  accepted: '已加入',
  revoked: '已撤销',
  expired: '已过期',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

export function MemberAccessCard() {
  const user = useAuthStore((state) => state.user)
  const enabled = user?.role === 'owner' && getDataProvider() === 'supabase'
  const invitations = useMemberInvitations(enabled)
  const form = useForm<InvitationValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { name: '', email: '', role: 'business' },
  })

  if (!enabled) return null

  const submit = async (values: InvitationValues) => {
    if (!user) return
    try {
      await invitations.save({ input: values, invitedBy: user.id })
      form.reset({ name: '', email: '', role: values.role })
      toast.success('成员邀请已保存，待对方使用该邮箱注册或登录')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '邀请保存失败')
    }
  }

  const revoke = async (id: string) => {
    try {
      await invitations.revoke(id)
      toast.success('邀请已撤销')
    } catch {
      toast.error('撤销邀请失败，请稍后重试')
    }
  }

  const reinvite = async (invitation: MemberInvitation) => {
    if (!user) return
    try {
      await invitations.save({
        input: {
          name: invitation.name,
          email: invitation.email,
          role: invitation.role,
        },
        invitedBy: user.id,
      })
      toast.success('邀请已重新生效')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重新邀请失败')
    }
  }

  return (
    <Card className='glass-card max-w-5xl rounded-2xl border bg-background/60 shadow-none backdrop-blur-xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <ShieldCheck className='size-4 text-primary' />
          成员准入与邀请
        </CardTitle>
        <CardDescription>
          只有已完成邮箱邀请的账号才能进入工作台。角色以邀请记录为准，注册端不能自行指定。
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Form {...form}>
          <form
            className='grid gap-3 md:grid-cols-[1fr_1.4fr_12rem_auto] md:items-end'
            onSubmit={form.handleSubmit(submit)}
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>成员姓名</FormLabel>
                  <FormControl>
                    <Input placeholder='新成员姓名' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>登录邮箱</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='name@company.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工作台角色</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invitationRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled={invitations.isSaving}>
              {invitations.isSaving ? (
                <LoaderCircle className='size-4 animate-spin' />
              ) : (
                <UserPlus className='size-4' />
              )}
              保存邀请
            </Button>
          </form>
        </Form>

        {invitations.isLoading ? (
          <LoaderCircle className='size-4 animate-spin text-muted-foreground' />
        ) : invitations.isError || !invitations.data ? (
          <LoadStateError
            title='邀请列表加载失败'
            description='请检查数据服务后重试。'
            onRetry={() => void invitations.refetch()}
          />
        ) : invitations.data.length === 0 ? (
          <p className='rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground'>
            暂无邀请记录。先添加成员邮箱，再让对方注册账号。
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>成员</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead className='text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.data.map((invitation) => {
                const status = getEffectiveInvitationStatus(invitation)
                const actions = getInvitationActions(invitation)
                return (
                  <TableRow key={invitation.id}>
                    <TableCell className='font-medium'>
                      {invitation.name}
                    </TableCell>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>{roleLabels[invitation.role]}</TableCell>
                    <TableCell>
                      <Badge
                        variant={status === 'accepted' ? 'default' : 'outline'}
                      >
                        {statusLabels[status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                    <TableCell className='text-right'>
                      {actions.canRevoke ? (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          disabled={invitations.isSaving}
                          onClick={() => void revoke(invitation.id)}
                        >
                          撤销
                        </Button>
                      ) : actions.canReinvite ? (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          disabled={invitations.isSaving}
                          onClick={() => void reinvite(invitation)}
                        >
                          重新邀请
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
