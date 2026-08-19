#!/bin/bash
# 一键启动 WorkBuddy 本地网关（双击运行）
# 用途：让本机工作台能调用本机 WorkBuddy CLI。
cd "$(dirname "$0")"
echo "正在启动 WorkBuddy 网关…"
node "$(dirname "$0")/server.mjs" --port 8877
echo "网关已退出。"
