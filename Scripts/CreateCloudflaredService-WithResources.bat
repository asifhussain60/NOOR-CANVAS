@echo off
REM ================================================================
REM CreateCloudflaredService-WithResources.bat
REM Fully rebuilds Cloudflared tunnel serving:
REM   - resources.kashkole.com (NEW - for CDN)
REM   - noorcanvas.kashkole.com
REM   - session.kashkole.com
REM Uses exact user paths and robust UUID extraction.
REM ================================================================

setlocal

REM --- Configuration ---
set SERVICE_NAME=Cloudflared
set "CLOUDFLARED_PATH=D:\PROJECTS\__CLOUDFLARE\cloudflared.exe"
set "CONFIG_DIR=C:\Users\asifh\.cloudflared"
set "CONFIG_PATH=C:\Users\asifh\.cloudflared\config.yml"
set TUNNEL_NAME=noorcanvas
set DOMAIN1=resources.kashkole.com
set DOMAIN2=noorcanvas.kashkole.com
set DOMAIN3=session.kashkole.com

echo ===============================================================
echo   Recreating Cloudflare Tunnel Service (%TUNNEL_NAME%)
echo   WITH resources.kashkole.com CDN support
echo ===============================================================

REM --- Check for Administrator ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Must be run as Administrator.
    pause
    exit /b 1
)

REM --- Verify cloudflared.exe exists ---
if not exist "%CLOUDFLARED_PATH%" (
    echo ERROR: cloudflared.exe not found at %CLOUDFLARED_PATH%
    pause
    exit /b 1
)

REM --- Stop and delete existing service ---
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel%==0 (
    echo Stopping and deleting existing Cloudflared service...
    net stop "%SERVICE_NAME%" >nul 2>&1
    sc delete "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 >nul
) else (
    echo No existing Cloudflared service found.
)

REM --- Delete existing tunnels ---
echo Deleting old tunnels...
for /f "skip=1 tokens=1" %%i in ('"%CLOUDFLARED_PATH%" tunnel list 2^>nul') do (
    echo Removing tunnel ID %%i
    "%CLOUDFLARED_PATH%" tunnel delete -f %%i >nul 2>&1
)

REM --- Clean up credentials ---
if exist "%CONFIG_DIR%" (
    echo Cleaning old Cloudflared credentials and configs...
    del /q "%CONFIG_DIR%\*.json" >nul 2>&1
    del /q "%CONFIG_PATH%" >nul 2>&1
) else (
    mkdir "%CONFIG_DIR%" >nul 2>&1
)

REM --- Create new tunnel and capture UUID ---
echo Creating new tunnel: %TUNNEL_NAME% ...
for /f "tokens=7 delims= " %%A in ('"%CLOUDFLARED_PATH%" tunnel create %TUNNEL_NAME% 2^>^&1 ^| find "id"') do set "TUNNEL_ID=%%A"
if "%TUNNEL_ID%"=="" (
    echo ERROR: Unable to parse tunnel ID.
    pause
    exit /b 1
)
echo Tunnel created with UUID: %TUNNEL_ID%

REM --- Build config.yml for THREE hostnames ---
echo Writing config.yml ...
(
    echo tunnel: %TUNNEL_ID%
    echo credentials-file: "%CONFIG_DIR%\%TUNNEL_ID%.json"
    echo.
    echo ingress:
    echo   - hostname: %DOMAIN1%
    echo     service: http://127.0.0.1:80
    echo   - hostname: %DOMAIN2%
    echo     service: http://127.0.0.1:80
    echo   - hostname: %DOMAIN3%
    echo     service: http://127.0.0.1:8080
    echo   - service: http_status:404
) > "%CONFIG_PATH%"

REM --- Add DNS routes ---
echo Adding DNS route for %DOMAIN1% (Resources CDN)...
"%CLOUDFLARED_PATH%" tunnel route dns %TUNNEL_NAME% %DOMAIN1%
echo Adding DNS route for %DOMAIN2% (NoorCanvas)...
"%CLOUDFLARED_PATH%" tunnel route dns %TUNNEL_NAME% %DOMAIN2%
echo Adding DNS route for %DOMAIN3% (KSESSIONS)...
"%CLOUDFLARED_PATH%" tunnel route dns %TUNNEL_NAME% %DOMAIN3%

REM --- Install as Windows Service ---
echo Installing Cloudflared Windows service...
"%CLOUDFLARED_PATH%" service install --config "%CONFIG_PATH%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to install service.
    pause
    exit /b 1
)

REM --- Start service ---
echo Starting Cloudflared service...
net start "%SERVICE_NAME%" >nul 2>&1
if %errorlevel%==0 (
    echo Cloudflared service started successfully.
) else (
    echo WARNING: Service created but failed to start. Check Event Viewer or config.yml.
)

echo ===============================================================
echo   Cloudflare Tunnel recreation completed successfully.
echo   - resources.kashkole.com -^> localhost:80 (KashkoleResources IIS)
echo   - noorcanvas.kashkole.com -^> localhost:80 (NoorCanvas IIS)
echo   - session.kashkole.com -^> localhost:8080 (KSESSIONS IIS)
echo ===============================================================
pause
