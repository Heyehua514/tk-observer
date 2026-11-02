# TK观察 Web

Vite + React 18 的纯 SPA 前端。项目级启动、开发和打包说明见仓库根目录 `README.md`。

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

PocketBase 默认连接 `http://127.0.0.1:8090`，也可通过 `VITE_POCKETBASE_URL` 提供初始地址，或在应用设置页持久化远程地址。

## E2E 回归

默认使用 Playwright 托管 Chromium；若本机未安装该浏览器，可指向本机 Chrome：

```powershell
$env:PLAYWRIGHT_CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
pnpm --dir apps/web build
pnpm --dir apps/web exec playwright test e2e/notification-design-deeplink.spec.ts --project=chromium
```
