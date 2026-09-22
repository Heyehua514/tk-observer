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

# 触发器：每天定点 + 开机登录时自动触发补跑
$triggerDaily = New-ScheduledTaskTrigger -Daily -At $Time
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($triggerDaily, $triggerLogon) -Settings $settings -Force
Write-Host "[Scheduler] 已成功注册每日计划任务: $taskName ，每天 $Time 及开机登录时自动推进！" -ForegroundColor Green
