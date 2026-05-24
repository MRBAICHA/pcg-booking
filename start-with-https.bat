@echo off
echo ============================================
echo  PCG Car Booking - Start with HTTPS Tunnel
echo ============================================
echo.

echo [1/2] Starting Next.js dev server on port 3002...
start "PCG Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Creating HTTPS tunnel via localhost.run...
echo      (URL will appear below - use it on iPhone)
echo.
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -R 80:localhost:3002 localhost.run

pause
