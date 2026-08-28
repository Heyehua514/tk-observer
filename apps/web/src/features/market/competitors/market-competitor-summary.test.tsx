import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MarketCompetitorSummary } from './market-competitor-summary'

vi.mock('./use-market-competitors', () => ({
  useMarketCompetitors: () => ({ data: [] }),
}))

it('offers a direct route to maintain competitor accounts when empty', async () => {
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <MarketCompetitorSummary />
    </QueryClientProvider>
  )

  const link = screen.getByRole('link', { name: '去维护对标账号' })
  await expect.element(link).toBeInTheDocument()
  await expect
    .element(link)
    .toHaveAttribute('href', '/editing?section=competitors')
})
