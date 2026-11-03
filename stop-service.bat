@echo off
echo ======================================================
echo   Stopping Workspace Tree Service (Port 7337)...
echo ======================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort 7337 -State Listen -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host '  [OK] Workspace Tree Service stopped successfully (PID:' $conn.OwningProcess ')' } else { Write-Host '  [!] Service is not currently running.' }"

echo ======================================================
