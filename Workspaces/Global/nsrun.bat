@echo off
REM NOOR Canvas Global Launcher - nsrun.bat
REM This allows running 'nsrun' from anywhere in the system

set NOOR_CANVAS_PATH=D:\PROJECTS\NOOR CANVAS
set NCRUN_SCRIPT=%NOOR_CANVAS_PATH%\Workspaces\Global\ncrun.ps1

if not exist "%NOOR_CANVAS_PATH%" (
    echo Error: NOOR Canvas workspace not found at %NOOR_CANVAS_PATH%
    exit /b 1
)

if not exist "%NCRUN_SCRIPT%" (
    echo Error: ncrun.ps1 script not found at %NCRUN_SCRIPT%
    exit /b 1
)

echo Launching NOOR Canvas from: %CD%
echo Using workspace: %NOOR_CANVAS_PATH%

PowerShell.exe -ExecutionPolicy Bypass -File "%NCRUN_SCRIPT%" %*
