# 微信视频号同步契约

采集端每次只提交一个视频号的一批数据。工作台不接收微信密码、登录二维码、access token 或设备序列号。

```json
{
  "idempotencyKey": "wechat-2026-08-24-account-a",
  "source": "wechat_channels_android",
  "account": { "externalId": "channel-a", "name": "账号 A" },
  "snapshot": { "date": "2026-08-24", "followerCount": 12000 },
  "videos": [{ "externalId": "video-1", "title": "示例视频", "publishDate": "2026-08-23", "views": 12000, "completionRate": 62, "likes": 500, "comments": 48, "followerGain": 36, "videoType": "口播" }]
}
```

`idempotencyKey` 防止同一批次重复写入。`followerGain` 是视频级涨粉；账号日涨粉由 `video_account_snapshots` 的当天与上一条快照相减。采集失败写入 `video_sync_runs.error_message`，不覆盖已有指标。
