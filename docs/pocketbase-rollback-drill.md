# PocketBase 回退演练（dry-run 只读）

> 用途：Supabase 不可用时，把前端数据源切回本地 PocketBase 的操作手册。
> 所属工作台：全局（数据源容灾）。
> 权限：只读检查由脚本完成，回退操作由人工手动执行；脚本不修改 .env、不启动服务、不访问网络。

## 一、先跑只读检查

```bash
node scripts/supabase/pocketbase-rollback.mjs
```

自动判定（验收标准一）：加 `--drill` 参数，脚本以退出码给出就绪结论，三项（data.db 存在、migration 文件 ≥ 15、Supabase 导出目录存在）任一缺失输出 DRILL_READY_FAIL 并返回非 0。

```bash
node scripts/supabase/pocketbase-rollback.mjs --drill
```

输出 5 项状态：

1. 当前数据提供者（.env 的 `VITE_DATA_PROVIDER`）。
2. PocketBase URL 配置（`.env` 的 `VITE_POCKETBASE_URL`）。
3. PocketBase 数据库文件 `backend/pb_data/data.db` 是否存在及字节数。
4. PocketBase migration 文件数（决定启动后表结构是否完整）。
5. Supabase 导出目录 `/tmp/tk-observer-supabase` 的 json/csv 文件清单。

任何一项缺失（尤其 data.db 不存在）都先恢复数据再继续，不要直接切 provider。

## 二、回退操作清单（人工执行）

1. 备份当前 `apps/web/.env`。
2. 把 `apps/web/.env` 的 `VITE_DATA_PROVIDER` 改为 `pocketbase`（Supabase 变量可保留但不生效）。
3. 启动后端：`backend/pocketbase serve --http=127.0.0.1:8090`（首次启动自动应用 `backend/pb_migrations/`）。
4. 前端冷启动：`pnpm dev`。
5. 用验收账号登录，逐工作台抽查：达人 / 剪辑 / 商务 / 市场 / 设计列表与详情、文件预览、审批流。
6. 重点核对 Supabase 期间新增的数据是否已回灌 PocketBase：
   - 若期间只有本地测试数据，可直接放弃；
   - 若有真实业务数据，先执行 `scripts/supabase/export-pb-business.mjs` 的逆向导入流程（导入脚本见 B5 交付），再回切。
7. 验证通过前不删除 Supabase 项目与 `/tmp/tk-observer-supabase` 导出目录。

## 三、验收标准

- [x] dry-run 脚本输出 data.db 存在、migration 文件 ≥ 15（自动判定：`--drill` 退出码 0 + `evaluateReadiness` 单测 3 断言；2026-08-14 实跑 DRILL_READY_PASS：data.db 843776 字节、migration 21 个、导出目录 15 个文件）。
- [ ] provider 切换后登录、五个工作台抽查全部可用。
- [ ] 文件预览（设计/场地/物料/财务凭证）在 PocketBase 文件存储下正常。
- [ ] 回切后新增的每一条数据能在 PocketBase 侧复现（验证数据流不回 Supabase）。

## 四、回切 Supabase（再次切换）

重复同样流程：provider 改回 `supabase`，启动 Supabase（`supabase start`），确认 migration 已应用（`supabase db reset` 或 `db push`），再启动前端。同一套清单反向执行即可。

## 五、自动回归

```bash
node --test scripts/supabase/pocketbase-rollback.test.mjs
```

覆盖：.env 解析、provider 默认值、data.db 缺失检测、导出目录存在/缺失两种状态、7 步清单顺序。
