# WorkBuddy 本地网关

让部署到公网的 Web 工作台能调用本机 WorkBuddy(CodeBuddy) CLI。
网关只在你的 mac 上运行，默认绑定 127.0.0.1。

## 启动

```bash
node scripts/workbuddy-gateway/server.mjs --port 8877
```

保持这个终端常驻（关掉终端网关就停了）。WorkBuddy App 需保持登录。

## 前端接线

剪辑工作台「视频 AI 分析」默认请求 `http://127.0.0.1:8877/analyze`。
如改端口，浏览器里设置 localStorage `tk.workbuddy.gateway` 为网关地址。

## 健康检查

```bash
curl http://127.0.0.1:8877/health
```

## 重要

- 网关会消耗你 WorkBuddy 的 credits，只在人工点「开始分析」时触发。
- 仅绑定本机，生产跨机调用前需额外加认证与加密（默认不开启）。

## 开机自启（可选）

首次安装：双击 `install-launch-agent.command`，或在项目根目录执行：

```bash
bash scripts/workbuddy-gateway/install-launch-agent.command
```

安装后由 macOS `launchd` 在登录时自动启动，异常退出会自动拉起。网关仍只监听 `127.0.0.1`，WorkBuddy App 需保持已登录。
