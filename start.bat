@echo off
title Workspace Tree - Dual OS Visualizer
cd /d "%~dp0"

:: Start the background service silently if not already running
wscript "%~dp0start-service.vbs"

:: Give service a quick moment
timeout /t 1 /nobreak >nul

:: Check for Microsoft Edge or Chrome to launch in clean App Mode
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:7337
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:7337
) else (
    start http://localhost:7337
)
