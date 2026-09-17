@echo off
chcp 65001 >nul
echo 正在启动 WorkBuddy 网关...
node "%~dp0server.mjs" --port 8877
pause
