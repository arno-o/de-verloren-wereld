#!/bin/bash
set -e
cd "$(dirname "$0")"

nohup node scripts/serve-dist.mjs >/tmp/offline-server.log 2>&1 &
disown

sleep 1
open "http://localhost:4173"

sleep 1
osascript -e 'tell application "System Events" to keystroke "f" using {control down, command down}'

osascript -e 'tell application "Terminal" to close (every window whose frontmost is true)'
