@echo off
REM Production Host Provisioner Token Generator
REM Usage: create-token-prod.bat <SESSION_ID> [CREATED_BY]

setlocal
set ASPNETCORE_ENVIRONMENT=Production

if "%1"=="" (
    echo ERROR: Session ID required
    echo Usage: create-token-prod.bat ^<SESSION_ID^> [CREATED_BY]
    echo Example: create-token-prod.bat 212 "Admin Name"
    exit /b 1
)

set SESSION_ID=%1
set CREATED_BY=%2

if "%CREATED_BY%"=="" (
    set CREATED_BY=Production User
)

echo.
echo ===============================================
echo  NOOR Canvas Host Provisioner - PRODUCTION
echo  Database: KSESSIONS
echo  Session ID: %SESSION_ID%
echo  Created By: %CREATED_BY%
echo ===============================================
echo.

dotnet run -- create --session-id %SESSION_ID% --created-by "%CREATED_BY%" --dry-run false

endlocal
