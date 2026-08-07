/** 飞书连接状态面板；权限：所有已登录角色。 */
import { Cloud, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FeishuConnectButton } from '@/components/shared/feishu-connect-button'

export function FeishuConnectPanel({
  connected,
  connectedAt,
  connecting,
  configured,
  onConnect,
}: {
  connected: boolean
  connectedAt: string
  connecting: boolean
  configured: boolean
  onConnect: () => void
}) {
  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]'>
      <Card className='shadow-none'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Cloud className='size-4' />
            个人飞书账号
          </CardTitle>
          <CardDescription>
            连接后，系统会按你的访问权限同步文档、知识库和多维表格。
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <div className='font-medium'>
              {connected ? '同步通道已建立' : '尚未建立同步通道'}
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              {connectedAt
                ? `连接时间：${new Date(connectedAt).toLocaleString('zh-CN')}`
                : configured
                  ? '使用当前登录人的飞书身份完成授权。'
                  : '请先配置 VITE_FEISHU_APP_ID。'}
            </div>
          </div>
          <FeishuConnectButton
            connected={connected}
            connecting={connecting}
            disabled={!configured}
            onConnect={onConnect}
          />
        </CardContent>
      </Card>
      <Card className='shadow-none'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <ShieldCheck className='size-4' />
            权限边界
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm text-muted-foreground'>
          <p>每位成员只绑定自己的飞书账号。</p>
          <p>访问令牌加密保存，不通过业务 API 返回。</p>
          <Button className='px-0' variant='link' asChild>
            <a
              href='https://open.feishu.cn/document'
              rel='noreferrer'
              target='_blank'
            >
              查看飞书授权说明
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
