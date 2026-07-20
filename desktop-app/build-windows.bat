@echo off
echo ============================================
echo   IrwFS Desktop App - Windows Build Script
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Building Windows installer...
call npm run build:win
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/3] Build complete!
echo.
echo Output files are in the 'dist' folder:
echo   - IrwFS Face Swap Setup 1.0.0.exe (Installer)
echo   - IrwFS Face Swap 1.0.0.exe (Portable)
echo.
pause
