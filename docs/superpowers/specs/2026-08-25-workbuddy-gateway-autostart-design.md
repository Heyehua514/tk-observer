# WorkBuddy 网关客户端自启动设计

## 目标

用户完成 WorkBuddy 自身登录后，打开 TK观察桌面客户端即可使用 AI 助手，不再手动双击 `.command`。客户端启动后三秒内应让 `http://127.0.0.1:8877/health` 可用；网关异常退出后自动恢复；任何 AI 写入仍需用户确认。

## 已确认现状

- 公网页面统一请求 `http://127.0.0.1:8877/analyze`。
- 现有 Node 网关能够执行 CodeBuddy CLI，但依赖本机 Node 和项目源代码。
- 现有 LaunchAgent plist 写死了 Node 与仓库绝对路径，客户端换目录或源代码不在本机时会失效。
- WorkBuddy CLI 自己持有登录状态，TK观察不应复制、保存或传输 WorkBuddy Token。

## 方案比较

### A. 桌面客户端内置 Rust 网关，采用

Tauri 启动时在独立监督线程中监听 `127.0.0.1:8877`，直接执行 WorkBuddy CLI。没有 Node、仓库路径或额外安装步骤，客户端退出后网关停止，下次打开客户端自动恢复。

### B. 打包 Node 网关为 sidecar，不采用

可复用现有 JavaScript，但必须连 Node runtime 一起打包，增加安装体积、签名面和更新复杂度。

### C. 首次启动自动安装 LaunchAgent，不采用

浏览器模式下无需打开客户端，但会留下系统级后台项，仍要处理版本升级、卸载、路径迁移与 Node runtime，维护成本高于用户当前需要。

## 架构

新增 `apps/desktop/src-tauri/src/workbuddy_gateway.rs`，职责限定为：

1. 监督本机 HTTP 服务生命周期。
2. 校验来源、方法、路径和请求大小。
3. 在 120 秒超时内执行 CodeBuddy CLI。
4. 将 CLI JSON 输出转换成稳定的 `{ ok, text }` 响应。

`lib.rs` 只在 Tauri `setup` 阶段调用 `workbuddy_gateway::spawn()`。如果 8877 已被旧网关占用，监督线程等待并定期重试；旧网关退出后客户端自动接管端口。桌面更新插件的注册顺序和配置不改。

## 数据流

```text
打开 TK观察客户端
  -> Tauri setup 启动网关监督线程
  -> 绑定 127.0.0.1:8877
  -> Web 工作台 POST /analyze
  -> 校验 Origin + prompt
  -> 执行 WorkBuddy CLI
  -> 严格解析 assistant 输出
  -> 返回结果，用户确认后才保存
```

CLI 路径优先读取 `WORKBUDDY_CLI`，macOS 默认使用 WorkBuddy 安装包内的 CodeBuddy CLI。TK观察不保存凭据，首次授权和续期仍由 WorkBuddy 自己完成。

## 安全与错误处理

- 只监听 `127.0.0.1`，不开放局域网或公网。
- 浏览器请求只接受正式站点、该 Pages 项目的预览域、本地开发地址和 Tauri WebView 来源。
- `/analyze` 请求体限制为 1 MiB；空提示词返回 `400`。
- CLI 缺失、未登录、非零退出、输出无效或超时统一返回非敏感错误码，不返回本机路径、stderr 或凭据。
- 健康检查不执行模型调用，不消耗 WorkBuddy 额度。
- 旧 Node 网关和安装脚本暂不删除，只作为兼容和排障入口。

## 测试与度量

Gate 测试覆盖来源白名单、请求体上限、assistant 文本提取、CLI 错误归一化和端口占用恢复策略。前端测试与 eval 确认错误提示改为打开桌面客户端，不再要求普通用户运行 `.command`。

可见结果：客户端启动后 `/health` 返回 `200`；无需手动终端即可执行 AI；非允许网页的预检请求返回 `403`；AI 结果仍不会自动写入业务数据。

## 边界

本轮不修改网页登录持久化、桌面更新器、Supabase、AI 数据读取范围或 WorkBuddy 登录机制。网页登录与 WorkBuddy 授权是独立状态。
