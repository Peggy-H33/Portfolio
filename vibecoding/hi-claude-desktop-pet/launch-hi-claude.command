#!/bin/bash
# 双击启动 Claude 桌宠 (可放在任意位置 / 解压后直接用)
# Double-click to launch the Claude desktop pet.
DIR="$(cd "$(dirname "$0")" && pwd)"
ELECTRON="$DIR/node_modules/electron/dist/Electron.app"

if [ ! -d "$ELECTRON" ]; then
  echo "找不到 Electron,正在安装依赖… (first run: installing dependencies)"
  cd "$DIR" && npm ci
fi

open -n -a "$ELECTRON" --args "$DIR"
echo "Hi, Claude! 桌宠已启动，可以关闭此窗口。"
sleep 1
