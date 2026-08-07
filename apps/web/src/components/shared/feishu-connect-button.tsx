/** 飞书账号连接命令；权限：所有已登录角色。 */
import { CheckCircle2, Link2, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FeishuConnectButton({
  connected,
  connecting = false,
  disabled = false,
  onConnect,
}: {
  connected: boolean
  connecting?: boolean
  disabled?: boolean
  onConnect: () => void
}) {
  const label = connected
    ? '飞书账号已连接'
    : connecting
      ? '正在连接飞书'
      : '连接飞书账号'

  return (
    <Button
      className='min-w-40'
      disabled={connected || connecting || disabled}
      onClick={onConnect}
      type='button'
    >
      {connected ? (
        <CheckCircle2 className='size-4' />
      ) : connecting ? (
        <LoaderCircle className='size-4 animate-spin' />
      ) : (
        <Link2 className='size-4' />
      )}
      {label}
    </Button>
  )
}
