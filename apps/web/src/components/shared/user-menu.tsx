/** 顶部栏用户菜单，提供个人信息、设置和彻底退出。 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { KeyRound, LogOut, Settings, UserRound } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RoleAvatar } from '@/components/shared/role-avatar'
import { ChangePasswordDialog } from './change-password-dialog'

export function UserMenu() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  if (!user) return null

  const signOut = async () => {
    await logout()
    queryClient.clear()
    sessionStorage.clear()
    await navigate({ to: '/login', replace: true })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-9 gap-2 px-2'>
            <RoleAvatar name={user.name} role={user.role} />
            <span className='hidden text-sm sm:inline'>{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuLabel>
            <div>{user.name}</div>
            <div className='mt-0.5 text-xs font-normal text-muted-foreground'>
              {user.email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserRound className='size-4' />
            个人信息
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate({ to: '/settings' })}>
            <Settings className='size-4' />
            系统设置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
            <KeyRound className='size-4' />
            修改密码
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onSelect={signOut}>
            <LogOut className='size-4' />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </>
  )
}
