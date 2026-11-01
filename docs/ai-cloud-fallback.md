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
- 未设置 `AI_API_KEY` 时函数返回 `AI_NOT_CONFIGURED`，前端回落到统一的 `GATEWAY_UNAVAILABLE` 提示。

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
- 单次上游请求超时 120 秒，前端整体超时 125 秒。
- 不在日志中输出 prompt 全文与 API Key；上游失败只记录状态码与截断后的响应片段。
- CORS 当前允许任意来源，若后续绑定固定生产域名应收紧 `Access-Control-Allow-Origin`。

## 前端相关文件

- `apps/web/src/features/shared-ai/workbuddy-gateway.ts`
- `apps/web/src/features/shared-ai/workbuddy-gateway.test.ts`
- `supabase/functions/ai-proxy/index.ts`
- `supabase/functions/ai-proxy/core.mjs`
- `supabase/functions/ai-proxy/core.test.mjs`

## 当前状态

代码、纯逻辑测试与 Web 全量测试已通过；Edge Function 尚未使用生产 Secrets 部署，需由管理员执行上面的部署命令后，才能把“跨设备 AI 可用”标记为线上验证完成。