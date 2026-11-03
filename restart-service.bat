@echo off
echo ======================================================
echo   Restarting Workspace Tree Service (Port 7337)...
echo ======================================================

call "%~dp0stop-service.bat"
powershell -Command "Start-Sleep -Milliseconds 600"
wscript "%~dp0start-service.vbs"
powershell -Command "Start-Sleep -Milliseconds 600"

echo   [OK] Service restarted in background.
echo   - URL: http://localhost:7337
echo ======================================================
