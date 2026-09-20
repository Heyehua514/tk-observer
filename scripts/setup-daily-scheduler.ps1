# 一键注册/移除 Windows 计划任务
param(
    [string]$Time = "09:00",
    [switch]$Uninstall
)

$taskName = "TKObserverDailyAutoRunner"

if ($Uninstall) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "[Scheduler] 已成功移除任务: $taskName" -ForegroundColor Yellow
    exit 0
}

$scriptPath = "C:\Users\1\Documents\Codex\2026-09-14\wo\work\tk-observer-git\scripts\daily-runner.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host "[Scheduler] 已成功注册每日计划任务: $taskName ，每天 $Time 自动运行推进！" -ForegroundColor Green
