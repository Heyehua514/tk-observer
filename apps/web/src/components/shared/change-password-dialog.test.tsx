import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ChangePasswordError } from '@/lib/auth'
import { ChangePasswordDialog } from './change-password-dialog'

const mocks = vi.hoisted(() => ({
  changeCurrentPassword: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, changeCurrentPassword: mocks.changeCurrentPassword }
})

vi.mock('sonner', () => ({ toast: mocks.toast }))

async function renderDialog(open = true) {
  const queryClient = new QueryClient()
  const onOpenChange = vi.fn()
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ChangePasswordDialog open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>
  )
  return { screen, onOpenChange }
}

it('shows validation when confirm password differs', async () => {
  const { screen } = await renderDialog()
  await userEvent.type(
    screen.getByRole('textbox', { name: '当前密码', exact: true }),
    'Tk2026@Observer'
  )
  await userEvent.type(
    screen.getByRole('textbox', { name: '新密码', exact: true }),
    'NewPass123'
  )
  await userEvent.type(
    screen.getByRole('textbox', { name: '确认新密码', exact: true }),
    'Other123'
  )
  await userEvent.click(screen.getByRole('button', { name: '确认修改' }))
  await expect
    .element(screen.getByText('两次输入的新密码不一致'))
    .toBeInTheDocument()
  expect(mocks.changeCurrentPassword).not.toHaveBeenCalled()
})

it('calls change password with values and closes on success', async () => {
  mocks.changeCurrentPassword.mockResolvedValue(undefined)
  const { screen, onOpenChange } = await renderDialog()
  await userEvent.type(
    screen.getByRole('textbox', { name: '当前密码', exact: true }),
    'OldPass123'
  )
  await userEvent.type(
    screen.getByRole('textbox', { name: '新密码', exact: true }),
    'NewPass123'
  )
  await userEvent.type(
    screen.getByRole('textbox', { name: '确认新密码', exact: true }),
    'NewPass123'
  )
  await userEvent.click(screen.getByRole('button', { name: '确认修改' }))
  await vi.waitFor(() =>
    expect(mocks.changeCurrentPassword).toHaveBeenCalledWith(
      'OldPass123',
      'NewPass123'
    )
  )
  await vi.waitFor(() => expect(mocks.toast.success).toHaveBeenCalled())
  await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
})

it('shows wrong password toast on failure', async () => {
  mocks.changeCurrentPassword.mockRejectedValue(
    new ChangePasswordError('WRONG_PASSWORD')
  )
  const { screen } = await renderDialog()
  await userEvent.type(
    screen.getByRole('textbox', { name: '当前密码', exact: true }),
    'WrongPass'
  )
  await userEvent.type(
    screen.getByRole('textbox', { name: '新密码', exact: true }),
    'NewPass123'
  )
  await userEvent.type(
    screen.getByRole('textbox', { name: '确认新密码', exact: true }),
    'NewPass123'
  )
  await userEvent.click(screen.getByRole('button', { name: '确认修改' }))
  await vi.waitFor(() =>
    expect(mocks.toast.error).toHaveBeenCalledWith('当前密码不正确')
  )
})
