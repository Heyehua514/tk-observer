/** 飞书连接页；权限：所有已登录角色。 */
import { useEffect } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { FeishuConnectPanel } from './components/feishu-connect-panel'
import {
  buildFeishuAuthorizeUrl,
  validateFeishuCallback,
} from './feishu-auth'
import { useFeishuConnection } from './hooks/use-feishu-connection'

const FEISHU_STATE_KEY = 'tk-observer-feishu-oauth-state'

export function FeishuConnectPage() {
  const { connection, exchangeToken } = useFeishuConnection()
  const appId = import.meta.env.VITE_FEISHU_APP_ID?.trim() || ''

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('code')) return
    try {
      const code = validateFeishuCallback(
        window.location.search,
        sessionStorage.getItem(FEISHU_STATE_KEY)
      )
      sessionStorage.removeItem(FEISHU_STATE_KEY)
      window.history.replaceState({}, '', '/settings/feishu')
      exchangeToken.mutate(code, {
        onSuccess: () => toast.success('飞书账号连接成功'),
        onError: () => toast.error('飞书授权失败，请重新连接'),
      })
    } catch {
      sessionStorage.removeItem(FEISHU_STATE_KEY)
      window.history.replaceState({}, '', '/settings/feishu')
      toast.error('飞书授权校验失败')
    }
  }, [exchangeToken])

  const connect = () => {
    if (!appId) return
    const state = crypto.randomUUID()
    sessionStorage.setItem(FEISHU_STATE_KEY, state)
    window.location.assign(
      buildFeishuAuthorizeUrl({
        appId,
        redirectUri: `${window.location.origin}/settings/feishu`,
        state,
      })
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='飞书连接'
        description='管理个人授权与知识同步状态。'
      />
      <FeishuConnectPanel
        connected={connection.data?.connected || false}
        connectedAt={connection.data?.connectedAt || ''}
        connecting={exchangeToken.isPending}
        configured={Boolean(appId)}
        onConnect={connect}
      />
    </div>
  )
}
