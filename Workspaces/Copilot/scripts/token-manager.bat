@echo off
REM ============================================================
REM  NoorCanvas Host Token Generator - Interactive Mode
REM  Database: KSESSIONS
REM ============================================================

set ASPNETCORE_ENVIRONMENT=Production

echo.
echo ============================================================
echo   NoorCanvas Host Token Generator (Interactive)
echo   Environment: Production (KSESSIONS database)
echo ============================================================
echo.

dotnet HostProvisioner.dll

set ASPNETCORE_ENVIRONMENT=
