# TK观察 Web

Vite + React 18 的纯 SPA 前端。项目级启动、开发和打包说明见仓库根目录 `README.md`。

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

PocketBase 默认连接 `http://127.0.0.1:8090`，也可通过 `VITE_POCKETBASE_URL` 提供初始地址，或在应用设置页持久化远程地址。
