@echo off
REM NOOR Canvas Token (nct) - Global Batch Wrapper
REM This wrapper makes nct available anywhere within the NOOR Canvas workspace

REM Find the NOOR CANVAS root directory
set "current_dir=%cd%"
set "noor_canvas_root="

REM Search upward for NOOR CANVAS directory
:find_root
if exist "%cd%\Workspaces\Global\nct.ps1" (
    set "noor_canvas_root=%cd%"
    goto :found_root
)
if "%cd%"=="%cd:~0,3%" goto :not_found
cd ..
goto :find_root

:not_found
echo Error: nct can only be run from within the NOOR CANVAS workspace
echo Current directory: %current_dir%
cd /d "%current_dir%"
exit /b 1

:found_root
cd /d "%current_dir%"
powershell -File "%noor_canvas_root%\Workspaces\Global\nct.ps1" %*
