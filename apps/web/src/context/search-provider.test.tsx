import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { SearchProvider } from '@/context/search-provider'

const GLOBAL_SEARCH_PLACEHOLDER = '搜索达人、商品、视频、客户…'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

async function renderWithSearchProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return await render(
    <QueryClientProvider client={queryClient}>
      <SearchProvider>{null}</SearchProvider>
    </QueryClientProvider>
  )
}

/**
 * Open the global search by shortcut, retrying while the keydown listener may not be mounted yet.
 * Waits between attempts so a successful toggle is not immediately undone by a second chord.
 */
async function openGlobalSearch(
  screen: RenderResult,
  modifier: 'Control' | 'Meta' = 'Control'
) {
  await vi.waitFor(
    async () => {
      const isCommandPaletteOpen =
        document.querySelector(
          `[placeholder="${GLOBAL_SEARCH_PLACEHOLDER}"]`
        ) !== null

      if (!isCommandPaletteOpen) {
        await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`)
      }

      await expect
        .element(screen.getByPlaceholder(GLOBAL_SEARCH_PLACEHOLDER))
        .toBeInTheDocument()
    },
    { interval: 50, timeout: 5000 }
  )
}

describe('SearchProvider and global search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the global search when it is opened', async () => {
    const screen = await renderWithSearchProvider()
    const { getByPlaceholder, getByText } = screen

    await openGlobalSearch(screen)

    await expect
      .element(getByPlaceholder(GLOBAL_SEARCH_PLACEHOLDER))
      .toBeInTheDocument()
    await expect
      .element(getByText('输入至少两个字开始搜索'))
      .toBeInTheDocument()
  })

  it('does not show search content when it is closed', async () => {
    const { getByPlaceholder } = await renderWithSearchProvider()

    await expect
      .element(getByPlaceholder(GLOBAL_SEARCH_PLACEHOLDER))
      .not.toBeInTheDocument()
  })

  it.each([
    ['Ctrl', 'Control'],
    ['Cmd', 'Meta'],
  ] as const)(
    'opens global search when %s + K is pressed',
    async (_label, modifier) => {
      const screen = await renderWithSearchProvider()

      await expect
        .element(screen.getByPlaceholder(GLOBAL_SEARCH_PLACEHOLDER))
        .not.toBeInTheDocument()

      await openGlobalSearch(screen, modifier)

      await expect
        .element(screen.getByPlaceholder(GLOBAL_SEARCH_PLACEHOLDER))
        .toBeInTheDocument()
    }
  )

  it('shows an empty state for a query with no matches', async () => {
    const screen = await renderWithSearchProvider()

    await openGlobalSearch(screen)

    await userEvent.fill(
      screen.getByPlaceholder(GLOBAL_SEARCH_PLACEHOLDER),
      'zzzz-no-match-xxxx'
    )

    await expect.element(screen.getByText('未找到相关内容')).toBeInTheDocument()
  })

  it('shows the minimum-length hint for a short query', async () => {
    const screen = await renderWithSearchProvider()

    await openGlobalSearch(screen)

    await userEvent.fill(
      screen.getByPlaceholder(GLOBAL_SEARCH_PLACEHOLDER),
      'a'
    )

    await expect
      .element(screen.getByText('输入至少两个字开始搜索'))
      .toBeInTheDocument()
  })
})
