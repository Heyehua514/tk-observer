/**
 * 设计审核通知深链浏览器回归。
 * 用途：通知已读回写失败时仍跳转素材库，精确定位待审素材并为 boss 自动打开审核弹窗。
 * 权限：使用接口契约夹具，不依赖真实 Supabase、测试账号或密码。
 */
import { expect, test, type Page } from 'playwright/test'

const bossUser = {
  id: 'boss-1',
  email: 'boss@example.test',
  name: '磊哥',
  role: 'boss',
}

const notification = {
  id: 'notification-1',
  recipient_id: bossUser.id,
  type: 'design_review',
  title: '设计稿待审核',
  content: '请打开素材库处理待审设计稿。',
  link: '/design',
  record_type: 'design_asset',
  record_id: 'asset-2',
  is_read: false,
  created_at: '2026-10-30T01:00:00.000Z',
  deleted_at: null,
}

const assets = [
  {
    id: 'asset-1',
    file_name: '已通过素材.png',
    file_path: '',
    dimensions: '1080x1080',
    region: 'US',
    status: 'approved',
    owner_id: 'designer-1',
    review_reason: '',
    reviewed_by: 'boss-1',
    reviewed_at: '2026-10-30T00:30:00.000Z',
    created_at: '2026-10-30T00:00:00.000Z',
    updated_at: '2026-10-30T00:30:00.000Z',
    deleted_at: null,
  },
  {
    id: 'asset-2',
    file_name: '待审素材.png',
    file_path: '',
    dimensions: '1080x1920',
    region: 'UK',
    status: 'pending_review',
    owner_id: 'designer-1',
    review_reason: '',
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-10-30T00:00:00.000Z',
    updated_at: '2026-10-30T01:00:00.000Z',
    deleted_at: null,
  },
]

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-expose-headers': 'Content-Range',
    'content-range': '0-9/10',
  }
}

async function fulfillJson(
  route: Parameters<Parameters<Page['route']>[1]>[0],
  body: unknown,
  status = 200
) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: corsHeaders(),
    body: JSON.stringify(body),
  })
}

async function mockNotificationDeepLinkApi(page: Page) {
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() })
      return
    }
    const table = new URL(request.url()).pathname.split('/').at(-1)
    if (table === 'notifications' && request.method() === 'PATCH') {
      await fulfillJson(
        route,
        { code: 'PGRST500', message: 'simulated read-state failure' },
        500
      )
      return
    }
    if (table === 'notifications') {
      await fulfillJson(route, [notification])
      return
    }
    if (table === 'notification_preferences') {
      await fulfillJson(route, {
        deadline_enabled: true,
        review_enabled: true,
        follow_up_enabled: true,
      })
      return
    }
    if (table === 'design_assets') {
      await fulfillJson(route, assets)
      return
    }
    await fulfillJson(route, [])
  })
}

test('read-state failure does not block exact design asset navigation', async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: 'block' })
  const page = await context.newPage()
  try {
    await page.addInitScript((user) => {
      sessionStorage.setItem('tk-observer-user-session', JSON.stringify(user))
    }, bossUser)
    await mockNotificationDeepLinkApi(page)

    await page.goto('/notifications')
    await expect(
      page.getByRole('heading', { name: '通知中心' })
    ).toBeVisible()
    await page.getByRole('button', { name: /设计稿待审核/ }).click()

    await expect(page).toHaveURL(
      /\/design\?recordType=design_asset&recordId=asset-2/
    )
    await expect(
      page.getByRole('heading', { name: '审核设计稿' })
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('tab', { name: '素材库' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    const focusedAsset = page.locator('article', { hasText: '待审素材.png' })
    await expect(focusedAsset).toHaveAttribute('data-focused', 'true')
  } finally {
    await context.close()
  }
})

const businessUser = {
  id: 'business-1',
  email: 'business@example.test',
  name: '董雨辰',
  role: 'business',
}

test('missing linked asset keeps a recoverable design route', async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: 'block' })
  const page = await context.newPage()
  try {
    await page.addInitScript((user) => {
      sessionStorage.setItem('tk-observer-user-session', JSON.stringify(user))
    }, bossUser)
    await page.route('**/rest/v1/**', async (route) => {
      const request = route.request()
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders() })
        return
      }
      const table = new URL(request.url()).pathname.split('/').at(-1)
      if (table === 'notifications') {
        await fulfillJson(route, [])
        return
      }
      if (table === 'notification_preferences') {
        await fulfillJson(route, {
          deadline_enabled: true,
          review_enabled: true,
          follow_up_enabled: true,
        })
        return
      }
      if (table === 'design_assets') {
        await fulfillJson(route, assets.slice(0, 1))
        return
      }
      await fulfillJson(route, [])
    })

    await page.goto('/design?recordType=design_asset&recordId=deleted-asset')
    await expect(page.getByText('目标素材不可用')).toBeVisible()
    await expect(page.getByRole('tab', { name: '素材库' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await page.getByRole('button', { name: '查看全部素材' }).click()
    await expect(page).not.toHaveURL(/recordType=design_asset/)
    await expect(
      page.locator('article', { hasText: '已通过素材.png' })
    ).toBeVisible()
  } finally {
    await context.close()
  }
})

test('business cannot open a forbidden design asset deep link', async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: 'block' })
  const page = await context.newPage()
  try {
    await page.addInitScript((user) => {
      sessionStorage.setItem('tk-observer-user-session', JSON.stringify(user))
    }, businessUser)
    await page.route('**/rest/v1/**', async (route) => {
      const request = route.request()
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders() })
        return
      }
      const table = new URL(request.url()).pathname.split('/').at(-1)
      if (table === 'notifications') {
        await fulfillJson(route, [])
        return
      }
      if (table === 'notification_preferences') {
        await fulfillJson(route, {
          deadline_enabled: true,
          review_enabled: true,
          follow_up_enabled: true,
        })
        return
      }
      if (table === 'design_assets') {
        await fulfillJson(route, assets)
        return
      }
      await fulfillJson(route, [])
    })

    await page.goto('/design?recordType=design_asset&recordId=asset-2')
    await expect(page.getByText('无法打开目标素材')).toBeVisible()
    await expect(page.getByRole('tab', { name: '素材库' })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: '设计需求' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await page.getByRole('button', { name: '返回设计需求' }).click()
    await expect(page).not.toHaveURL(/recordType=design_asset/)
    await expect(page.getByText('无法打开目标素材')).toHaveCount(0)
  } finally {
    await context.close()
  }
})