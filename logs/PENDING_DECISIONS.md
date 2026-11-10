# 待用户拍板问题清单 (Pending Decisions)

> 规则：需要用户定夺的业务/方案决策暂存此处；记录后立即继续推进其他无依赖任务，不等待、不停工。用户上线解决后即时清空或归档。

## 2026-11-09 GitHub 历史同步阻塞已解除

- 旧记录中的 7897 代理故障仍存在，但本次通过 `git -c http.proxy= push origin main` 临时直连成功，未改持久 Git 配置。
- 远程 main 从 `a67c846` 更新至 `9f83731`，包含 11 月 5、6、7 日三个已保存提交和本轮 AI 修复。下方此前推送失败记录保留为历史，不能再据此判断当前代码未同步。
- 后续仅日志提交再次遇到网络波动：直连三次失败后停止，功能修复仍已在远程。网络恢复后同步剩余日志提交，不需要重做代码。

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

## 2026-10-29 [BLOCKED] Supabase 设计审核通知测试无法实跑

- 现象：`pnpm supabase:test` 再次返回 `LegacyDbConnectError`，无法连接 `127.0.0.1:54322`，提示需启动 Docker 与 Supabase。
- 影响：新增迁移 `20261029000200_design_review_result_notification.sql` 与 14 条 pgTAP 断言（常规 10 条 + eval 4 条）无法在本地 PostgreSQL 实例验证；Web 全量测试、类型检查、ESLint、RLS、Schema 与 PocketBase freeze 审计已通过。
- 建议：启用 Docker Desktop + WSL2 后执行 `pnpm supabase:start`，再执行 `pnpm supabase:test`，与选题导入恢复迁移一并完成 41 条 pgTAP 实跑。
- 处置：本轮仅尝试一次即按已知环境阻塞记录并旁路继续，不将数据库实跑标记为通过。

## 2026-10-29 [BLOCKED] GitHub 推送失败

- 现象：`git push origin main` 返回 `fatal: unable to access 'https://github.com/Heyehua514/tk-observer.git/': Recv failure: Connection was reset`。
- 影响：本地提交 `53ebad6` 已完成，但远程 `origin/main` 尚未同步。
- 建议：网络恢复后仅重试一次 `git push origin main`，确认远程分支后继续。
- 处置：按单点最多重试 3 次约束，首次失败后立即记录并停止重试，不重复推送。
## 2026-10-30 [BLOCKED] Supabase pgTAP 实跑环境未恢复

- 现象：`pnpm supabase:test` 返回 `LegacyDbConnectError`，无法连接 `127.0.0.1:54322`，错误为 `ECONNREFUSED`；本机无可用 Docker。
- 影响：2026-10-29 新增的两份迁移共 41 条 pgTAP（选题导入 27 条 + 设计审核通知 14 条）仍无法在本地 PostgreSQL 实例验证；今日未新增数据库迁移。
- 建议：启用 Docker Desktop + WSL2 后执行 `pnpm supabase:start`，再执行 `pnpm supabase:test`，完成后恢复 `[BLOCKED]` 标记。
- 处置：按三击熔断规则仅尝试一次并旁路跳过，不将数据库实跑标记为通过。
## 2026-10-30 GitHub 推送失败（记录并旁路）

- 现象：`git push origin main` 返回 `fatal: unable to access 'https://github.com/Heyehua514/tk-observer.git/': Recv failure: Connection was reset`。
- 影响：本地提交 `b2ae3ef` 已完成，但远程 `origin/main` 尚未同步；本地领先远程 1 个提交。
- 建议：网络恢复后仅重试一次 `git push origin main`；无需代码改动。
- 处置：按三击熔断规则首次失败后立即记录并停止重试，不重复推送。
## 2026-11-02 AI 云端通道已部署（阻塞解除）

- 处置：已完成 `supabase login`、写入 Secrets（AI_API_KEY/AI_BASE_URL/AI_MODEL）、部署 `ai-proxy`，函数状态 ACTIVE 且 `verify_jwt: true`。
- 验证：未登录 POST 返回 `401 AUTH_REQUIRED`；上游 `/chat/completions` 直连返回正常；部署产物已包含 `index.ts` 与 `core.mjs`。
- 剩余：登录态双设备各发起一次分析，确认前端自动回退成功（需在浏览器完成）。

### 原记录（已解除，仅存档）

## 2026-11-01 [BLOCKED] AI 云端通道未部署（缺平台凭据）

- 现象：对 `https://mddldiwthvnaefwtlnme.supabase.co/functions/v1/ai-proxy` 发 POST 返回 `404`（函数未部署）；`npx supabase projects list` 返回 `LegacyPlatformAuthRequiredError: Access token not provided`，本机无 `SUPABASE_ACCESS_TOKEN`，工作区也无 `.env` 提供凭据。
- 影响：跨设备 AI 自动回退通道代码与测试已完成，但线上未生效；换设备时若本机 WorkBuddy 不在线仍会提示“本机 WorkBuddy 与云端 AI 通道均不可用”。
- 建议（需用户执行，属生产变更）：
  1. `npx supabase login`（或设置 `SUPABASE_ACCESS_TOKEN`）。
  2. `npx supabase secrets set AI_API_KEY=<deepseek key> AI_MODEL=deepseek-chat AI_BASE_URL=https://api.deepseek.com/v1 --project-ref mddldiwthvnaefwtlnme`。
  3. `npx supabase functions deploy ai-proxy --project-ref mddldiwthvnaefwtlnme`。
  4. 两台设备登录同一账号，在工作台 AI 面板各发起一次分析，确认返回 `channel: "cloud"`。
- 处置：按三击熔断记录后旁路，不将线上可用标记为已验收。部署文档见 `docs/ai-cloud-fallback.md`。
## 2026-11-02 推送再次失败

- 现象：`git push origin main` 连续 3 次失败（2 次 `Connection was reset`，1 次 `Failed to connect to github.com port 443`）。
- 影响：本地提交 `268ec6c`（AI 云端通道上线文档与日志）未同步，`origin/main` 落后 1 个提交。**代码本身已生效：`ai-proxy` 已部署上线**。
- 建议：检查网络代理/VPN 后执行 `git push origin main`。
## 2026-11-02 推送阻塞定位（网络层）

- 现象：`git push origin main` 再次 `Connection was reset`；`github.com` 解析到 `20.205.243.166`，该 IP 的 443 不可达；`140.82.113.3:443` 可建立 TCP 连接。本机未监听 7890/7897/1080/10809/8080 代理端口。
- 结论：不是仓库或凭据问题，是到 GitHub 亚太节点的链路被阻断。
- 影响：本地已提交 `268ec6c`、`fb1155b`、`fca129f`、`6046fae`，`origin/main` 落后 4 个提交。
- 处置：按三击熔断停止重试。开启可用的代理/VPN 后执行一次 `git push origin main`；或用 `http.proxy` 指向本机代理。### 2026-11-02 推送阻塞已解除

- 处置：检测到本机代理端口 7897，使用 `git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=...` 推送成功：`78e7676..a9d7921 main -> main`，5 个本地提交已全部同步。

## 2026-11-05 [BLOCKED] 成片指标投影 pgTAP 无法实跑

- 现象：本机仍无 Docker/WSL2，`127.0.0.1:54322` 不可连接，新增 `video_metrics_log_projection.test.sql` 的 10 条断言无法执行。
- 影响：迁移 SQL 已静态审查，但数据库触发器行为尚未在真实 PostgreSQL 实例验证；不能把 pgTAP 标记为通过。
- 建议：启用 Docker Desktop/WSL2 后执行 `pnpm supabase:start` 与 `pnpm supabase:test`，连同既有 pgTAP 一并补跑。
- 处置：按三击熔断规则不重复死磕本机环境，今日通过类型检查、前端定向测试、schema/RLS 静态审计与迁移代码审查旁路继续。

## 2026-11-06 [BLOCKED] 情报转任务 pgTAP 无法实跑

- 现象：`pnpm supabase:test` 返回 `LegacyDbConnectError`，连接 `127.0.0.1:54322` 时 `ECONNREFUSED`，提示需先运行 `supabase start`。
- 影响：新增 `intelligence_task_conversion.test.sql` 的 13 条断言无法在本地 PostgreSQL 实例验证；静态审查、类型检查、情报域浏览器测试、schema/RLS 审计均通过。
- 建议：启用 Docker Desktop/WSL2 后执行 `pnpm supabase:start` 与 `pnpm supabase:test`，连同历史 pgTAP 一并补跑。
- 处置：本轮仅尝试一次即按已知环境阻塞记录并旁路继续，不将数据库实跑标记为通过。

## 2026-11-06 [BLOCKED] GitHub 推送失败

- 现象：`git push origin main` 返回 `fatal: unable to access ... Failed to connect to github.com port 443 via 127.0.0.1`；本机 Git 配置的代理端口 7897 未监听。
- 影响：本地提交 `0929ade` 已完成，`main` 领先 `origin/main` 2 个提交，远程尚未同步。
- 建议：启动可用代理/VPN 或恢复 7897 端口后执行一次 `git push origin main`；无需改动代码。
- 处置：首次失败即记录并停止重试，不重复推送。
## 2026-11-07 [BLOCKED] 总览四工作台待办 pgTAP 无法实跑

- 现象：`pnpm supabase:test` 返回 `LegacyDbConnectError`，连接 `127.0.0.1:54322` 时 `ECONNREFUSED`，提示需先运行 `supabase start`；本机无可用 Docker/WSL2。
- 影响：`supabase/tests/overview_action_items.test.sql` 的 13 条断言未在真实 PostgreSQL 实例执行，四工作台聚合、排序、limit 与底层 RLS 行为不能标记为数据库验收通过。
- 建议：启用 Docker Desktop/WSL2 后执行 `pnpm supabase:start`、`pnpm supabase:test`、`pnpm supabase:types`，补跑历史 pgTAP 并核对生成类型。
- 处置：按三击熔断记录环境阻塞并旁路继续；类型检查、Web 全量测试、schema/RLS 静态审计与 PocketBase freeze 检查已完成。
## 2026-11-07 [BLOCKED] GitHub 推送失败

- 现象：`git push origin main` 返回 `Failed to connect to github.com port 443 via 127.0.0.1 after 2062 ms: Could not connect to server`。
- 影响：本地提交已完成，`main` 领先 `origin/main` 3 个提交，远程尚未同步；代码与日志均已保留在本地。
- 建议：启动可用代理/VPN 或恢复 127.0.0.1 代理端口后执行一次 `git push origin main`，无需改动代码。
- 处置：首次失败即记录并停止重试，不重复推送。

## 2026-11-10 [BLOCKED] AI 记忆生命周期 pgTAP 本地实例不可连接

- 现场：今日执行一次 `pnpm supabase:test`，返回 `LegacyDbConnectError` / `ECONNREFUSED 127.0.0.1:54322`。属于已有环境阻塞，未重复启动或重试。
- 影响：新增 `ai_memory_lifecycle.test.sql` 19 条及 `ai_memory_lifecycle.eval.test.sql` 15 条断言无法实跑；未新增迁移，复用既有唯一约束与 owner RLS。不能将 SQL 静态检查视为数据库验收。
- 选项 A（建议）：恢复 Docker Desktop/WSL2 与本地 Supabase，执行 `pnpm supabase:start`、`pnpm supabase:test` 补跑全部 pgTAP。选项 B：在隔离 CI PostgreSQL/Supabase 环境执行，禁止改用生产库试验。
- 旁路：继续服务层、浏览器回归、类型检查与文档归档。
