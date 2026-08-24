# 微信视频号同步服务

这个服务接入 GitHub 项目 `FisJing/wechat-video-analytics` 的 JSON 采集产物，不复制它的硬编码设备/发布器依赖。采集项目负责 Android/ADB/OCR，当前服务负责标准化、幂等键、同步批次和 Supabase 写入。

## 使用

```bash
pnpm --dir services/wechat-video-sync test
pnpm --dir services/wechat-video-sync sync -- /absolute/path/capture.json
```

每日采集时设置 `WECHAT_COLLECTOR_DIR`、`WECHAT_COLLECTOR_ACCOUNT`、`WECHAT_CAPTURE_FILE`、`SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`，然后运行：

```bash
pnpm --dir services/wechat-video-sync run-collector
pnpm --dir services/wechat-video-sync schedule
```

多视频号顺序采集使用 `WECHAT_COLLECTOR_ACCOUNTS` JSON 数组，例如：

```bash
export WECHAT_COLLECTOR_ACCOUNTS='[{"key":"xin","output":"/tmp/xin-capture.json"},{"key":"zheng","output":"/tmp/zheng-capture.json"}]'
```

`schedule` 默认每天北京时间 02:00 执行；可用 `WECHAT_SYNC_HOUR` 和 `WECHAT_SYNC_MINUTE` 调整。服务需要持续运行，生产环境建议注册为 macOS launchd、Linux systemd 或容器定时任务。

`capture.json` 必须包含当前视频号标识、粉丝总数和视频指标。GitHub 项目原始输出没有粉丝总数，因此粉丝数需要在采集器中补充，缺失时服务会拒绝同步，避免产生虚假涨粉。
