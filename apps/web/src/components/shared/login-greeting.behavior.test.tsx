import { StrictMode } from 'react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { useAuthStore } from '@/stores/auth-store'
import { LoginGreeting } from './login-greeting'

beforeEach(() => {
  sessionStorage.clear()
  useAuthStore.getState().reset()
})

afterEach(() => useAuthStore.getState().reset())

it('shows the greeting when the authenticated user arrives after the shell mounts', async () => {
  const screen = await render(
    <StrictMode>
      <LoginGreeting />
    </StrictMode>
  )

  useAuthStore.getState().setUser({
    id: 'business-user',
    email: 'business@example.com',
    name: '董雨辰',
    role: 'business',
  })

  await expect.element(screen.getByRole('status')).toBeInTheDocument()
})
