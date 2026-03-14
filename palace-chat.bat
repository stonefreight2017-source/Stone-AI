@echo off
title THREE-HEADED MONSTER — Palace Command
color 0A
mode con: cols=80 lines=40

:: Enable ANSI escape sequences
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

:: Try vllm-env Python first, then system Python
if exist "C:\vllm-env\Scripts\python.exe" (
    set PYTHON_PATH=C:\vllm-env\Scripts\python.exe
    goto :run
)

if exist "C:\Users\admin\AppData\Local\Programs\Python\Python311\python.exe" (
    set PYTHON_PATH=C:\Users\admin\AppData\Local\Programs\Python\Python311\python.exe
    goto :run
)

:: Fallback to PATH python
where python >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_PATH=python
    goto :run
)

echo.
echo  ERROR: Python not found on this machine.
echo  Checked:
echo    - C:\vllm-env\Scripts\python.exe
echo    - C:\Users\admin\AppData\Local\Programs\Python\Python311\python.exe
echo    - System PATH
echo.
pause
exit /b 1

:run
:: Get the directory where this .bat lives (so it finds palace-chat.py)
set SCRIPT_DIR=%~dp0

echo.
echo   Connecting to Ollama on the Palace...
echo.

"%PYTHON_PATH%" "%SCRIPT_DIR%palace-chat.py"

echo.
echo   Session ended. Press any key to close.
pause >nul
