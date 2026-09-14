#!/bin/zsh
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo '请先安装 Node.js 22 或更新版本。'
  read '?按回车关闭'
  exit 1
fi
if curl -fsS http://127.0.0.1:8787/api/health >/dev/null 2>&1; then
  open http://127.0.0.1:8787/
  exit 0
fi
if [ ! -d node_modules ]; then npm ci; fi
npm run build
(sleep 3; open http://127.0.0.1:8787/) &
npm start
