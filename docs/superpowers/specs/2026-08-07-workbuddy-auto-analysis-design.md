# WorkBuddy 自动分析设计

## 目标

用本机 WorkBuddy CodeBuddy CLI 替换不可用的 Claude CLI，批量分析待处理的 `video_ideas`，输出标题规律、发布时间规律、内容类型偏好和中文总结。分析失败不得阻断视频录入，也不得伪造结果。

## 架构

`auto-analyze.pb.js` 保留为唯一入口。视频创建成功后只记录待处理状态，不同步调用 AI。服务端每 5 分钟串行扫描最多 50 条 `ai_analysis` 为空的记录，也保留 superuser 手动触发路由。

CLI 默认路径：

```text
/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy
```

部署时可用 `WORKBUDDY_CLI` 覆盖路径。PocketBase 使用 `$os.cmd` 参数数组调用，不经过 shell，不拼接可执行命令字符串。

## 调用约束

调用参数固定包含：

```text
-p <prompt>
--output-format json
--json-schema <schema>
--tools ""
--permission-mode dontAsk
--max-turns 1
--no-session-persistence
```

JSON Schema 要求返回 `titlePatterns`、`publishTimePatterns`、`contentTypePreferences` 和 `summary`。Hook 校验并规范化结果后，把完整 JSON 写入每条待处理记录的 `ai_analysis`，把当前时间写入 `analyzed_at`。

## 失败处理

- CLI 不存在、桌面端未登录、credits 不足、输出为空或 JSON 不合法时，不写 `ai_analysis` 和 `analyzed_at`。
- 失败记录保持待处理，下次 cron 或手动端点自动重试。
- 每次只运行一个批次，不并发调用 WorkBuddy。
- 自检日志明确区分 `completed`、`empty` 和 `workbuddy_unavailable`。

## 安全

- 客户端继续不能写 `ai_analysis` 和 `analyzed_at`。
- 手动端点继续只允许 PocketBase superuser。
- CLI 禁用工具、禁止会话持久化，不允许读取或修改项目文件。
- 不引入 API Key，不调用 HTTP LLM API。

## 验证

1. 单元测试覆盖 WorkBuddy JSON 包装解析、纯 JSON 解析和非法输出。
2. PocketBase 临时库验证创建视频不等待 AI、手动触发成功写回、重复触发为空。
3. 模拟 CLI 缺失时验证记录保持待处理。
4. 运行 typecheck、lint、format、全量测试、eval 和 build。
