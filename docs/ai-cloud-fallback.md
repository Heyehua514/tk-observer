# AI 云端兜底通道（ai-proxy）

## 为什么需要

本机 WorkBuddy 网关只存在于安装了桌面客户端并完成登录的电脑。换到另一台设备后，浏览器无法访问 `127.0.0.1:8877`，界面就会显示“未接入 WorkBuddy”。

现在前端统一走 `callWorkBuddyGateway()`：

```text
本机 WorkBuddy（127.0.0.1:8877/analyze）
  └─ 失败或超时
       └─ Supabase Edge Function：/functions/v1/ai-proxy
            └─ DeepSeek 兼容接口 /chat/completions
```

云端通道校验 Supabase 用户 JWT，API Key 只存在于 Edge Function Secrets，不下发浏览器。

## 部署

```bash
supabase secrets set AI_API_KEY=<key> AI_MODEL=deepseek-chat AI_BASE_URL=https://api.deepseek.com/v1
supabase functions deploy ai-proxy
```

- `AI_MODEL` 默认 `deepseek-chat`。
- `AI_BASE_URL` 默认 `https://api.deepseek.com/v1`，必须是 HTTPS，末尾斜杠会自动去除。
- 兼容别名：`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL`。
- 未设置 `AI_API_KEY` 时函数返回 `AI_NOT_CONFIGURED`，前端明确提示管理员检查模型服务；登录失效、网络失败、上游失败和空结果各自提供不同提示。

## 请求契约

```http
POST /functions/v1/ai-proxy
Authorization: Bearer <supabase access token>
apikey: <supabase publishable/anon key>
Content-Type: application/json

{ "prompt": "..." }
```

成功：

```json
{ "ok": true, "text": "...", "channel": "cloud", "model": "deepseek-chat" }
```

## 错误码

| 错误码 | HTTP | 含义 |
| --- | --- | --- |
| `AUTH_REQUIRED` | 401 | 缺少或无效的 Supabase 用户 JWT |
| `METHOD_NOT_ALLOWED` | 405 | 非 POST/OPTIONS |
| `EMPTY_PROMPT` | 400 | prompt 为空 |
| `PROMPT_TOO_LARGE` | 400 | prompt 超过 200000 字符 |
| `AI_NOT_CONFIGURED` | 503 | 未配置 API Key / Base URL / 模型 |
| `AI_BASE_URL_INVALID` | 400 | Base URL 非 HTTPS |
| `AI_UPSTREAM_FAILED` | 502 | 上游模型返回非 2xx |
| `AI_EMPTY_RESPONSE` | 400 | 上游返回空内容 |

## 验证

1. 未登录调用：应返回 401 `AUTH_REQUIRED`。
2. 登录后在工作台 AI 面板发起一次分析：应返回 `channel: "cloud"`。
3. 关闭本机 WorkBuddy 后重复第 2 步，验证自动回退无需手动切换。
4. 两台设备分别登录同一账号，确认均可用。

## 安全边界

- 只有持有有效 Supabase 用户 JWT 的请求才会调用模型。
- 单次上游请求超时 120 秒。前端本机与云端请求各有 125 秒期限，涵盖读取响应体；本机失败后才开始云端请求，因此不能把 125 秒称为整个流程的总超时。
- 工作台各数据源最多等待 8 秒，部分数据源超时后保留其他结果并显示缺失提示；云端会话读取最多等待 8 秒。期限通过 Promise race 强制结束等待，同时发送 abort，避免只取消请求却继续卡住。
- 云端令牌来自当前项目 Supabase 客户端的 `auth.getSession()`，由 SDK 处理过期会话刷新，禁止遍历其他项目的 localStorage 会话。
- 面板依次显示读取工作台、检索知识库、调用模型三个阶段；失败后页面保留错误提示并重新开放执行按钮，重试时清除旧错误。
- 不在日志中输出 prompt 全文与 API Key；上游失败只记录状态码与截断后的响应片段。
- CORS 当前允许任意来源，若后续绑定固定生产域名应收紧 `Access-Control-Allow-Origin`。

## 前端相关文件

- `apps/web/src/features/shared-ai/workbuddy-gateway.ts`
- `apps/web/src/features/shared-ai/workbuddy-gateway.test.ts`
- `supabase/functions/ai-proxy/index.ts`
- `supabase/functions/ai-proxy/core.mjs`
- `supabase/functions/ai-proxy/core.test.mjs`

## 当前状态

已于 2026-11-02 部署到 `mddldiwthvnaefwtlnme`，函数状态 `ACTIVE`，`verify_jwt: true`。

- 上游通道：`https://www.apiloop.top/v1`，模型 `deepseek-v4.1-flash`（使用管理员现有模型凭据写入 Supabase Secrets）。
- 已验证：未登录调用返回 `401 {"ok":false,"error":"AUTH_REQUIRED"}`；同一凭据直连上游 `/chat/completions` 返回正常。
- 待验证：登录态下从两台设备各发起一次 AI 分析，确认前端自动回退且返回成功。

更换模型或 Key 时重新执行 `supabase secrets set` 后无需改代码；如需换供应商，同时更新 `AI_BASE_URL` 与 `AI_MODEL`。

## 2026-11-09 本地修复验证范围

本轮修改前端会话读取、超时和错误展示，不修改线上函数、Secrets 或权限。自动化测试使用模拟通道，验证缺失登录、跨项目陈旧令牌、上游异常、空输出、忽略 abort 的请求以及错误后的重试；不能替代真实登录后的模型调用和第二台设备验收。旧桌面安装包需要重新构建发布后才会包含修复。

## 2026-11-10 个人记忆确认与恢复

- 生成结果后点击“记住这条”，以生成时的工作台和任务类型作为记忆键。同一用户同一键更新原记录；删除后再次确认会恢复原记录。当前输入框或任务类型的后续编辑不会改变已生成结果的归属。
- 服务复用 `ai_memory` 的 `(owner_id,memory_key)` 唯一约束与既有 owner RLS；upsert 指定冲突键并写入 `deleted_at: null`，不新增迁移，不扩大权限。列表只读取当前 owner 的有效记录。
- 保存和删除必须返回记录 ID 才报告成功；无登录、非 Supabase 存储、权限拒绝或零行回写均报错。保存期间防止重复点击，失败保留分析结果，可直接重试，不需再次调用模型。
- 个人记忆读取失败显示“重试读取”，删除失败保留记忆并支持重试。成功写入后使当前用户的 `ai-memory` 查询缓存失效。
- 本地验收命令：`pnpm typecheck`、`pnpm --dir apps/web test`、`pnpm supabase:test`。Windows 默认浏览器缓存不可用时设置 `PLAYWRIGHT_CHROME_PATH` 为已安装 Chrome 的绝对路径，保持浏览器测试开启。
- `ai_memory_lifecycle.test.sql` / `.eval.test.sql` 共 34 条数据库断言；本机数据库未启动，尚未实跑。生产发布前仍须用两台设备实测：首次记住、同类覆盖、删除、再次记住；确认同一用户最终只有一条有效记忆，其他用户不能读取或覆盖。
