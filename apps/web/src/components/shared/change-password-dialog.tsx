/** 修改密码弹窗：登录后可自行更新当前账号密码。 */
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { ChangePasswordError, changeCurrentPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string().min(8, '新密码至少 8 位'),
    confirmPassword: z.string().min(1, '请再次输入新密码'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
  })
type ChangePasswordValues = z.infer<typeof changePasswordSchema>

const changePasswordMessages: Record<string, string> = {
  WEAK_PASSWORD: '新密码强度不足，请至少使用 8 位',
  WRONG_PASSWORD: '当前密码不正确',
  NETWORK: '无法连接服务器，请检查网络后重试',
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const submit = async (values: ChangePasswordValues) => {
    setSubmitting(true)
    try {
      await changeCurrentPassword(values.currentPassword, values.newPassword)
      form.reset()
      onOpenChange(false)
      toast.success('密码已修改')
    } catch (error) {
      const message =
        error instanceof ChangePasswordError
          ? changePasswordMessages[error.code]
          : changePasswordMessages.NETWORK
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LockKeyhole className='size-4 text-primary' />
            修改密码
          </DialogTitle>
          <DialogDescription>
            输入当前密码并设置新密码，修改后下次登录请使用新密码。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className='space-y-4'
            autoComplete='off'
            onSubmit={form.handleSubmit(submit)}
          >
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>当前密码</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      autoComplete='current-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新密码</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      autoComplete='new-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认新密码</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      autoComplete='new-password'
                      {...field}
                    />
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
                disabled={submitting}
              >
                取消
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting && <LoaderCircle className='size-4 animate-spin' />}
                确认修改
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
