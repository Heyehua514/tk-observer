#!/bin/bash
set -euo pipefail

AGENT_LABEL='com.tkobserver.workbuddy-gateway'
AGENT_DIR="$HOME/Library/LaunchAgents"
AGENT_PATH="$AGENT_DIR/$AGENT_LABEL.plist"
SOURCE_PATH="$(cd "$(dirname "$0")" && pwd)/$AGENT_LABEL.plist"

mkdir -p "$AGENT_DIR"
cp "$SOURCE_PATH" "$AGENT_PATH"
launchctl bootout "gui/$(id -u)/$AGENT_LABEL" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$AGENT_PATH"
launchctl kickstart -k "gui/$(id -u)/$AGENT_LABEL"

echo "WorkBuddy 网关已设置为登录后自动启动。"
for _ in {1..10}; do
  if health="$(curl --fail --silent --max-time 1 http://127.0.0.1:8877/health 2>/dev/null)"; then
    echo "$health"
    exit 0
  fi
  sleep 1
done
echo '网关进程已注册，但健康检查超时；请稍后重试。' >&2
exit 1
