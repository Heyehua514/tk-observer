# 2026-08-13 PocketBase → Supabase 数据对账报告

> 工具：`scripts/supabase/reconcile-pb-export.mjs`（只读，不写源库、不访问网络、不启动服务）。
> 数据来源：`backend/pb_data/data.db`（PocketBase 本地库）与 `supabase/migrations/*.sql`（Supabase 建表清单）。

## 结论

1. **业务数据无需迁移**：PocketBase 44 张表中 12 张映射表合计仅 28 行业务行（全部在已切 Supabase 的模块中），导入 Supabase 时逐表 INSERT 即可，无历史数据转换负担。
2. **真实列缺口只有 1 个**：`event_materials.designer`（PB 为 relation 字段，Supabase `event_materials` 缺 `designer_id`）。当前该表 0 行数据，切 Supabase 新建迁移时补一列 `designer_id uuid references auth.users(id)` 即可，不涉及存量数据。
3. **PB-only 表按用途分类处理**（详见下表），大部分是系统表或零数据表，不需要建对应 Supabase 业务表。
4. **Supabase-only 表**：`profiles`（Supabase 用户档案）与 `member_invitations`（邀请函）是 Supabase 侧新增能力，正常存在。

## 对账数字

| 指标 | 数量 |
|---|---|
| PocketBase 表 | 44 |
| Supabase 已建表 | 39 |
| PB-only 表 | 7 |
| Supabase-only 表 | 2 |
| 映射且有数据 | 12 |
| 映射表业务总行数 | 28 |
| 列缺口表 | 1（`event_materials.designer`，0 行） |

## PB-only 表处置建议

| 表 | 行数 | 建议 |
|---|---|---|
| `users` | 6 | 不迁移为业务表；映射到 Supabase Auth + `profiles`（账号已在注册分流中创建） |
| `comments` | 1 | 跳过或手动补录，属遗留演示数据 |
| `cooperation_followups` | 0 | 跳过（空表，若后续需要可建） |
| `feishu_documents` | 0 | 跳过（飞书文档缓存，Supabase 侧用集成能力替代） |
| `feishu_sync_state` | 0 | 跳过（同步状态缓存） |
| `knowledge_snippets` | 0 | 跳过（知识库片段） |
| `smart_summaries` | 0 | 跳过（AI 摘要缓存） |

## 列名归一化规则（对账工具内置）

`id→legacy_id`、`created→created_at`、`updated→updated_at`、`venue→venue_id`、
`event→event_id`、`phase→phase_id`、`client→client_id`、`creator→creator_id`、
`designer→designer_id`、`assignee→assignee_id`、`recipient→recipient_id`、
`requester→requester_id`、`owner→owner_id/owner_name`、`file→file_path`、
`photos→photo_paths`、`receipt→receipt_path` 等；原列名本身始终保留为候选。

## 下一步（Supabase 导入编排，不在本轮范围）

- 新建迁移补齐 `event_materials.designer_id` 列。
- 只读导出脚本已完成：`scripts/supabase/export-pb-business.mjs`，12 张映射表 21 行业务数据已导出为 JSON + CSV（`/tmp/tk-observer-supabase/`），供未来 Supabase 导入。
- `users` 6 行只做账号映射核对，不导入业务表。
