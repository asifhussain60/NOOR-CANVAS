@echo off
REM Ensure script always runs from its own folder
cd /d %~dp0

:: Copilot Manager Setup Script
:: This batch file creates a Python virtual environment, installs dependencies,
:: runs the migration script and optionally opens the dashboard.

echo ================================
echo Copilot Manager – Initial Setup
echo ================================
echo.

:: Prompt for the location of prompt.keys.zip
set /p KEYS_PATH="Enter the full path to prompt.keys.zip: "
if "%KEYS_PATH%"=="" (
  set KEYS_PATH=prompt.keys.zip
)
if not exist "%KEYS_PATH%" (
  echo [ERROR] The file "%KEYS_PATH%" does not exist.
  goto END
)

:: Prompt for the database path
set /p DB_PATH="Enter path for the database [copilot_manager\copilot_manager.db]: "
if "%DB_PATH%"=="" (
  set DB_PATH=copilot_manager\copilot_manager.db
)

:: Ask whether to open the dashboard after setup
set /p OPEN_DASH="Open dashboard after setup? (Y/N) [Y]: "
if "%OPEN_DASH%"=="" set OPEN_DASH=Y

echo.
echo [1/4] Creating virtual environment...
if not exist copilot_manager\.venv (
  python -m venv copilot_manager\.venv
)

echo [2/4] Activating virtual environment and installing requirements...
call copilot_manager\.venv\Scripts\activate
pip install --upgrade pip >nul
if exist copilot_manager\requirements.txt (
  pip install -r copilot_manager\requirements.txt
)

echo [3/4] Running migration...
python migrate.py --keys "%KEYS_PATH%" --db "%DB_PATH%"
if errorlevel 1 (
  echo [ERROR] Migration failed.
  goto END
)

echo [4/4] Setup complete.
echo Database created at %DB_PATH%

:: Optionally open the dashboard
if /I "%OPEN_DASH%"=="Y" (
  start "" "%cd%\copilot_manager\views\index.html"
)

:END
echo.
echo Setup script finished.
pause