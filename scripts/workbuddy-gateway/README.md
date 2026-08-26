# WorkBuddy 本地网关

让部署到公网的 Web 工作台能调用本机 WorkBuddy(CodeBuddy) CLI。
网关只在你的 mac 上运行，默认绑定 127.0.0.1。

## 正常使用

打开 TK观察桌面客户端即可。客户端内置网关会自动监听
`127.0.0.1:8877`，异常后自动恢复，不需要打开终端或安装登录项。

首次使用仍需在 WorkBuddy App 完成登录。登录状态由 WorkBuddy 自己保存，
TK观察不读取、不复制、不保存 WorkBuddy Token。后续只需保持 WorkBuddy 登录有效。

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

## 旧版排障入口

`start.command`、`install-launch-agent.command` 和 Node 网关仅保留给旧版本排障。
新版客户端首次启动时会停用精确名称
`com.tkobserver.workbuddy-gateway` 的旧 LaunchAgent，并将 plist 改名为
`.plist.disabled-by-tk-observer` 留作恢复备份，然后由内置 Rust 网关接管。

```bash
node scripts/workbuddy-gateway/server.mjs --port 8877
```

只有客户端无法启动且需要临时排障时才运行该命令。终端关闭后旧网关停止。

## 安全边界

- 只监听 `127.0.0.1`，不开放到局域网或公网。
- `/analyze` 只接受 TK观察正式 Pages 域、该项目预览域、本地开发页与 Tauri WebView 来源。
- 请求体上限 1 MiB，CLI 输出上限 8 MiB，单次最长 120 秒；网页调用 125 秒后自动结束等待。
- 同一时间只执行一个 AI 分析，第二个请求返回 `429 GATEWAY_BUSY`，避免重复扣费和本机资源耗尽。
- CLI 路径、stderr、登录信息与 Token 不返回给网页。
- AI 结果仍需用户确认后才能保存或执行，不自动修改业务数据。
