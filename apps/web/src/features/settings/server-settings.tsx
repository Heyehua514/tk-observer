/** 系统设置：配置并持久化远程 PocketBase 地址。 */
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, LoaderCircle, Server } from 'lucide-react'
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

const schema = z.object({
  url: z.string().trim().url('请输入完整的 http 或 https 地址'),
})
type Values = z.infer<typeof schema>

export function ServerSettings() {
  const [testing, setTesting] = useState(false)
  const [testedUrl, setTestedUrl] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { url: getStoredServerUrl() },
  })

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
        description='配置桌面端连接的远程 PocketBase 服务。'
      />
      <Card className='max-w-2xl shadow-none'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Server className='size-4' />
            PocketBase 服务器
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
    </div>
  )
}
