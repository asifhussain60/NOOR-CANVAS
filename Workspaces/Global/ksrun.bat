@echo off
REM NOOR Canvas KSRUN Batch Launcher
REM Provides easy access to ksrun.ps1 from any location

cd /d "D:\PROJECTS\NOOR CANVAS\Workspaces\Global"
powershell.exe -ExecutionPolicy Bypass -File "ksrun.ps1" %*
