# 日常自动化推进执行器
param(
    [string]$ProjectPath = "C:\Users\1\Documents\Codex\2026-09-14\wo\work\tk-observer-git"
)

$today = Get-Date -Format "yyyy-MM-dd"
Write-Host "[Auto-Runner] 开始执行 TK观察工作台 每日自动化推进 - 日期: $today" -ForegroundColor Cyan

# 提示词协议定义
$prompt = @"
严格遵循 agents.md 的【每日自主推进与日志规范】和 memory/LESSONS.md 的避坑经验：
1. 读取 ROADMAP.md 与最新 logs/ 日志，确定今日核心垂直切片任务（严格按 后端->服务层->前端->自检 顺序）。
2. 执行今日任务，单点错误重试最多 3 次，超过 3 次立即记录现场至 logs/PENDING_DECISIONS.md 并旁路跳过。
3. 执行 pnpm typecheck 或最小测试验证。
4. 归档今日日志至 logs/$today.md，头部必须严格包含【当前项目总体推进度：约 XX%】、今日完成项、明日排期、以及今日所学沉淀。
5. 将今日沉淀提炼 1 条规则追加至 memory/LESSONS.md。
6. 完成后执行 git add 与 git commit，提交信息格式：feat(daily): $today 进度推进与日志归档。
"@

# 调用本地 Codex 非交互式引擎执行
Set-Location -Path $ProjectPath
codex exec --cd $ProjectPath --dangerously-bypass-approvals-and-sandbox $prompt

Write-Host "[Auto-Runner] 今日自动化推进已完成。" -ForegroundColor Green

