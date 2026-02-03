@echo off
setlocal
cd /d %~dp0
echo Starting offline server...
node scripts\serve-dist.mjs
pause
