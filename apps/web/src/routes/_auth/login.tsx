/* eslint-disable react-refresh/only-export-components -- TanStack 文件路由需导出 Route */
// 路由：/login
// 权限：未登录
// 用途：成员自助注册或邮箱密码登录，成功后按角色进入默认工作台
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { memberOptions } from '@/types/auth'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import appIconUrl from '../../../../desktop/assets/icon.svg'
import {
  getDefaultRoute,
  LoginError,
  loginWithPassword,
  registerAccount,
  RegistrationError,
} from '@/lib/auth'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBeijingClock } from '@/components/shared/beijing-time'

const loginSchema = z.object({
  email: z.string().trim().min(1, '请输入邮箱').email('请输入有效邮箱'),
  password: z.string().min(1, '请输入密码'),
})
type LoginValues = z.infer<typeof loginSchema>

const registerSchema = z
  .object({
    memberName: z.string().min(1, '请选择您的姓名'),
    email: z.string().trim().min(1, '请输入邮箱').email('请输入有效邮箱'),
    password: z.string().min(8, '密码至少 8 位'),
    passwordConfirm: z.string().min(1, '请再次输入密码'),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: '两次输入的密码不一致',
    path: ['passwordConfirm'],
  })
type RegisterValues = z.infer<typeof registerSchema>

const loginMessages = {
  ACCOUNT_NOT_FOUND: '账号不存在',
  WRONG_PASSWORD: '密码错误，请重试',
  NETWORK: '无法连接服务器，请检查网络',
} as const

const registrationMessages = {
  EMAIL_REGISTERED: '该邮箱已注册，请直接登录',
  INVALID_INPUT: '注册信息不符合要求，请检查后重试',
  INVALID_MEMBER: '请从公司成员名单中选择您的姓名',
  MEMBER_REGISTERED: '该成员已注册，请直接登录或联系管理员',
  NETWORK: '无法连接服务器，请检查网络',
} as const

export const Route = createFileRoute('/_auth/login')({ component: LoginPage })

function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const navigate = useNavigate()
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      memberName: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
  })
  useEffect(() => {
    loginForm.reset({ email: '', password: '' })
    registerForm.reset({
      memberName: '',
      email: '',
      password: '',
      passwordConfirm: '',
    })
  }, [loginForm, registerForm])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const submitLogin = async (values: LoginValues) => {
    setSubmitError('')
    try {
      const user = await loginWithPassword(values.email, values.password)
      loginForm.reset({ email: '', password: '' })
      await navigate({ to: getDefaultRoute(user.role), replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof LoginError
          ? loginMessages[error.code]
          : '无法连接服务器，请检查网络'
      )
    }
  }

  const submitRegistration = async (values: RegisterValues) => {
    setSubmitError('')
    try {
      const user = await registerAccount(values)
      registerForm.reset()
      await navigate({ to: getDefaultRoute(user.role), replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof RegistrationError
          ? registrationMessages[error.code]
          : registrationMessages.NETWORK
      )
    }
  }

  const changeMode = (value: string) => {
    if (value !== 'login' && value !== 'register') return
    setMode(value)
    setSubmitError('')
    setShowPassword(false)
  }

  return (
    <div className='glass-card grid w-full grid-cols-1 overflow-hidden md:grid-cols-[56%_44%]'>
      <section className='flex flex-col justify-center gap-6 p-8 md:p-10'>
        <div className='space-y-5'>
          <img
            src={appIconUrl}
            alt='TK观察'
            className='logo-glow ml-6 size-14 rounded-2xl md:size-16'
          />
          <p className='pt-1 text-[11px] font-medium tracking-[0.24em] text-foreground/60 uppercase'>
            TK OBSERVER WORKBENCH
          </p>
          <h1 className='text-2xl font-semibold tracking-tight md:text-3xl'>
            看清信号，进入行动
          </h1>
          <p className='max-w-sm text-sm text-foreground/60'>
            统一查看经营走势、团队进度和最近业务动态。
          </p>
        </div>
        <div className='flex items-center gap-2 pt-1 text-xs text-success'>
          <span className='relative flex size-2' aria-hidden='true'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60' />
            <span className='relative inline-flex size-2 rounded-full bg-success' />
          </span>
          工作台服务正常
        </div>
      </section>

      <section className='border-t border-white/10 p-8 md:border-t-0 md:border-l md:p-10'>
        <div className='mb-5 flex items-baseline justify-between gap-3'>
          <h2 className='text-xl font-semibold tracking-tight'>
            登录工作台
          </h2>
          <time
            dateTime={now.toISOString()}
            className='text-xs text-foreground/50 tabular-nums'
            aria-label={`北京时间 ${formatBeijingClock(now)}`}
          >
            {formatBeijingClock(now)}
          </time>
        </div>
        <Tabs value={mode} onValueChange={changeMode}>
          <TabsList className='mb-4 grid w-full grid-cols-2'>
            <TabsTrigger value='login'>登录</TabsTrigger>
            <TabsTrigger value='register'>注册</TabsTrigger>
          </TabsList>

          <TabsContent value='login'>
            <Form {...loginForm}>
              <form
                className='space-y-4'
                autoComplete='off'
                onSubmit={loginForm.handleSubmit(submitLogin)}
              >
                <FormField
                  control={loginForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          autoComplete='off'
                          placeholder='name@tkobserver.local'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <div className='relative'>
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete='new-password'
                            className='pr-10'
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='absolute top-1/2 right-1 size-8 -translate-y-1/2'
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        >
                          {showPassword ? (
                            <EyeOff className='size-4' />
                          ) : (
                            <Eye className='size-4' />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {submitError && (
                  <p
                    role='alert'
                    className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                  >
                    {submitError}
                  </p>
                )}
                <Button
                  type='submit'
                  className='w-full'
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting && (
                    <LoaderCircle className='size-4 animate-spin' />
                  )}
                  登录
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value='register'>
            <Form {...registerForm}>
              <form
                className='space-y-4'
                autoComplete='off'
                onSubmit={registerForm.handleSubmit(submitRegistration)}
              >
                <FormField
                  control={registerForm.control}
                  name='memberName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='请选择您的姓名' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {memberOptions.map((member) => (
                            <SelectItem key={member.name} value={member.name}>
                              {member.name} · {member.workbench}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          autoComplete='off'
                          placeholder='name@tkobserver.local'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <div className='relative'>
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete='new-password'
                            className='pr-10'
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='absolute top-1/2 right-1 size-8 -translate-y-1/2'
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        >
                          {showPassword ? (
                            <EyeOff className='size-4' />
                          ) : (
                            <Eye className='size-4' />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name='passwordConfirm'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认密码</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete='new-password'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {submitError && (
                  <p
                    role='alert'
                    className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                  >
                    {submitError}
                  </p>
                )}
                <Button
                  type='submit'
                  className='w-full'
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting && (
                    <LoaderCircle className='size-4 animate-spin' />
                  )}
                  注册并进入工作台
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        <p className='mt-4 text-center text-xs text-foreground/50'>
          首次使用请先注册公司账号
        </p>
      </section>
    </div>
  )
}
