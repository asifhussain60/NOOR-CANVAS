@echo off
REM ============================================================
REM  NoorCanvas Host Token Generator (Production)
REM  Database: KSESSIONS
REM  Location: D:\Websites\NOOR-CANVAS\HostProvisioner
REM ============================================================

set ASPNETCORE_ENVIRONMENT=Production

echo.
echo ============================================================
echo   NoorCanvas Host Token Generator
echo   Environment: Production (KSESSIONS database)
echo ============================================================
echo.

REM Check if session ID was provided
if "%1"=="" (
    echo Usage: create-token.bat SESSION_ID [CREATED_BY]
    echo.
    echo Examples:
    echo   create-token.bat 212
    echo   create-token.bat 212 "Admin"
    echo   create-token.bat 212 "John Doe"
    echo.
    echo This will create a permanent host token in the KSESSIONS database.
    echo.
    goto :end
)

set SESSION_ID=%1
set CREATED_BY=%~2

REM Use default creator if not provided
if "%CREATED_BY%"=="" set CREATED_BY=Production Admin

echo Creating host token for Session %SESSION_ID%...
echo Created by: %CREATED_BY%
echo.

dotnet HostProvisioner.dll create --session-id %SESSION_ID% --created-by "%CREATED_BY%"

echo.
echo ============================================================
echo   Token generation complete
echo ============================================================
echo.

:end
set ASPNETCORE_ENVIRONMENT=
