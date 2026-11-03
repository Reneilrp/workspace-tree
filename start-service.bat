@echo off
cd /d "%~dp0"
:: Check if port 7337 is already running
netstat -ano | findstr ":7337" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    exit /b 0
)
node server.js
