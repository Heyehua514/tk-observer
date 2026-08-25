/** 系统设置：配置并持久化 PocketBase 回退服务地址。 */
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2,
  Link2,
  LoaderCircle,
  RefreshCw,
  Server,
} from 'lucide-react'
import PocketBase from 'pocketbase'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getStoredServerUrl, setPocketBaseUrl } from '@/lib/pocketbase'
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
import { PageHeader } from '@/components/shared/page-header'
import { getClientUpdateSurface } from './client-update-model'
import { checkAndInstallDesktopUpdate } from '@/lib/desktop-updater-actions'
import { getRuntimeDesktopUpdaterEnvironment } from '@/lib/desktop-updater'

const schema = z.object({
  url: z.string().trim().url('请输入完整的 http 或 https 地址'),
})
type Values = z.infer<typeof schema>

export function ServerSettings() {
  const [testing, setTesting] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [testedUrl, setTestedUrl] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { url: getStoredServerUrl() },
  })
  const isDesktop = Boolean(
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
  )
  const updaterEnvironment = getRuntimeDesktopUpdaterEnvironment()
  const updateSurface = getClientUpdateSurface(
    isDesktop,
    Boolean(updaterEnvironment.endpoint?.trim() && updaterEnvironment.publicKey?.trim())
  )

  const checkUpdate = async () => {
    if (!updateSurface.enabled || checkingUpdate) return
    setCheckingUpdate(true)
    try {
      const result = await checkAndInstallDesktopUpdate()
      if (result.state === 'current' || result.state === 'updated') {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('检查更新失败，请稍后重试')
    } finally {
      setCheckingUpdate(false)
    }
  }

  const test = async () => {
    const valid = await form.trigger()
    if (!valid) return
    setTesting(true)
    try {
      const url = form.getValues('url').replace(/\/$/, '')
      await new PocketBase(url).health.check()
      setTestedUrl(url)
      toast.success('PocketBase 连接正常')
    } catch {
      setTestedUrl('')
      toast.error('无法连接服务器，请检查网络')
    } finally {
      setTesting(false)
    }
  }

  const save = async (values: Values) => {
    if (testedUrl !== values.url.replace(/\/$/, '')) {
      toast.error('请先测试当前服务器地址')
      return
    }
    await setPocketBaseUrl(values.url)
    useAuthStore.getState().reset()
    queryClient.clear()
    toast.success('服务器地址已保存，请重新登录')
    await navigate({ to: '/login', replace: true })
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='系统设置'
        description='配置桌面端连接的 PocketBase 回退服务。'
      />
      <Card className='glass-card max-w-2xl rounded-2xl border bg-background/60 shadow-none backdrop-blur-xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Server className='size-4 text-primary' />
            PocketBase 回退服务器
          </CardTitle>
          <CardDescription>
            地址会持久化在本机。修改后会清空当前会话，避免不同服务器之间混用缓存。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className='space-y-4' onSubmit={form.handleSubmit(save)}>
              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>服务器地址</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://pb.example.com'
                        {...field}
                        onChange={(event) => {
                          field.onChange(event)
                          setTestedUrl('')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={test}
                  disabled={testing}
                >
                  {testing ? (
                    <LoaderCircle className='size-4 animate-spin' />
                  ) : testedUrl ? (
                    <CheckCircle2 className='size-4 text-green-600' />
                  ) : null}
                  测试连接
                </Button>
                <Button type='submit' disabled={!testedUrl}>
                  保存并重新登录
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className='glass-card max-w-2xl rounded-2xl border bg-background/60 shadow-none backdrop-blur-xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <RefreshCw className='size-4 text-primary' />
            {updateSurface.title}
          </CardTitle>
          <CardDescription>{updateSurface.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant='outline'
            disabled={!updateSurface.enabled || checkingUpdate}
            onClick={checkUpdate}
          >
            {checkingUpdate ? <LoaderCircle className='size-4 animate-spin' /> : null}
            {updateSurface.actionLabel}
          </Button>
        </CardContent>
      </Card>
      <Card className='glass-card max-w-2xl rounded-2xl border bg-background/60 shadow-none backdrop-blur-xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Link2 className='size-4 text-primary' />
            飞书账号
          </CardTitle>
          <CardDescription>
            连接个人飞书账号，启用文档与多维表格同步。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant='outline' asChild>
            <Link to='/settings/feishu'>管理飞书连接</Link>
          </Button>
          <Button variant='outline' asChild className='ml-2'>
            <Link to='/settings/notifications'>通知偏好</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
