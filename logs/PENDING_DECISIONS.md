# 待用户拍板问题清单 (Pending Decisions)

> 规则：需要用户定夺的业务/方案决策暂存此处；记录后立即继续推进其他无依赖任务，不等待、不停工。用户上线解决后即时清空或归档。

## 2026-10-23 远程推送网络失败

- 现象：`git push` 连续 3 次失败，前两次连接被重置，第三次连接 `github.com:443` 超时。
- 影响：本地提交与工作树已完成，`origin/main` 尚未同步。
- 建议：检查网络代理/VPN 或 GitHub 连通性后执行 `git push`；无需改动代码。
## 2026-10-26 远程推送仍失败

- 现象：`git push origin main` 连续 3 次失败；前两次为连接被重置，第三次 `github.com:443` 连接超时。
- 影响：本地提交 `feat(daily): 2026-10-26 进度推进与日志归档` 已完成，当前 `main` 领先 `origin/main` 12 个提交。
- 建议：检查网络代理/VPN 或 GitHub 连通性后执行 `git push origin main`；无需改动代码。

## 2026-10-28 远程推送恢复（归档）

- 开工核对 `git rev-list --left-right --count origin/main...main` 为 `0 0`，远程同步已恢复；2026-10-23 与 2026-10-26 的推送阻塞项不再需要处置。

## 2026-10-28 [BLOCKED] Supabase 数据库准入测试无法实跑

- 现象：`pnpm supabase:test` 返回 `LegacyDbConnectError`，无法连接 `127.0.0.1:54322`，提示 `Make sure Docker is running, then run: supabase start`。
- 环境：本机 `docker`、`podman` 不可用，WSL2 未安装或未配置。
- 影响：新增迁移 `20261028000100_member_invitation_transition_guard.sql` 与 18 条 pgTAP 断言无法在本地 PostgreSQL 实例验证；静态测试、Web 全量测试、类型检查、RLS 与 Schema 审计已通过。
- 建议：安装并启用 Docker Desktop + WSL2 后执行 `pnpm supabase:start`，再执行 `pnpm supabase:test`。
- 处置：已按三击熔断记录并旁路跳过，不将数据库实跑标记为通过。

## 2026-10-29 [BLOCKED] Supabase 选题导入恢复测试无法实跑

- 现象：`pnpm supabase:test` 返回 `LegacyDbConnectError`，无法连接 `127.0.0.1:54322`，返回 `ECONNREFUSED`。
- 影响：新增迁移 `20261029000100_video_idea_import_recovery.sql` 与 27 条 pgTAP 断言无法在本地 PostgreSQL 实例验证；Web 全量测试、类型检查、RLS、Schema 与 PocketBase freeze 审计已通过。
- 建议：启用 Docker Desktop + WSL2 后执行 `pnpm supabase:start`，再执行 `pnpm supabase:test` 完成数据库实跑与撤销并发验收。
- 处置：已按三击熔断记录并旁路继续，不将数据库实跑标记为通过。