/**
 * Playwright E2E 配置（商务工作台 CRUD 回归）
 * 用途：本地 vite preview 服务 + Chromium 跑端到端用例。
 * 所属工作台：全局（质量门禁）
 * 权限：需要本地 Supabase 与测试账号；密码经 TK_OBSERVER_TEST_PASSWORD 注入，不落仓库。
 */
import { defineConfig } from 'playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  // 沙箱环境下 Playwright 派生的预览服务监听会被拒绝；外部已起服务时跳过 webServer。
  webServer: process.env.E2E_USE_EXTERNAL_SERVER
    ? undefined
    : {
        command:
          'pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
        port: 4173,
        reuseExistingServer: true,
        timeout: 30_000,
      },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
