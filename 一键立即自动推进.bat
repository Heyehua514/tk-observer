@echo off
chcp 65001 >nul
title TK观察工作台 - 立即自动推进
echo ==========================================
echo 正在启动 TK观察工作台 自动化自驱推进...
echo ==========================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\daily-runner.ps1"
pause
