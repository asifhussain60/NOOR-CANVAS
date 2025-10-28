@echo off
REM ================================================================
REM START-CLOUDFLARED-TUNNEL.bat
REM Quick start script for Cloudflare tunnel after system restart
REM Run this after rebooting to start the resources.kashkole.com CDN
REM ================================================================

echo Starting Cloudflare Tunnel (resources.kashkole.com CDN)...
echo.

REM Start cloudflared in minimized window
start /MIN "Cloudflare Tunnel" "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe" tunnel --config "C:\Users\asifh\.cloudflared\config.yml" run noorcanvas

echo.
echo ✓ Tunnel started in background
echo.
echo Waiting 15 seconds for tunnel to connect...
timeout /t 15 /nobreak >nul

echo.
echo Testing production URL...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://resources.kashkole.com/IMAGES/1/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg' -UseBasicParsing -SkipCertificateCheck -TimeoutSec 20; Write-Host '✓ SUCCESS! resources.kashkole.com is LIVE' -ForegroundColor Green; Write-Host '  Status:' $r.StatusCode; Write-Host '  Size:' ([math]::Round($r.RawContentLength/1KB,2)) 'KB' } catch { Write-Host '✗ Failed:' $_.Exception.Message -ForegroundColor Red }"

echo.
echo ================================================================
echo   Cloudflare Tunnel Status
echo ================================================================
echo   • Tunnel: noorcanvas
echo   • Config: C:\Users\asifh\.cloudflared\config.yml
echo   • Domains:
echo     - resources.kashkole.com  → localhost:80
echo     - noorcanvas.kashkole.com → localhost:80
echo     - session.kashkole.com    → localhost:8080
echo ================================================================
echo.
pause
