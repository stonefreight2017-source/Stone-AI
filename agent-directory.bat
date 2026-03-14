@echo off
title Three-Headed Monster - Agent Directory
color 0A
mode con: cols=90 lines=45

:: Three-Headed Monster Agent Directory Launcher
:: Green on black CMD, auto-detects Python

echo.
echo  ============================================================
echo   THREE-HEADED MONSTER - AGENT DIRECTORY
echo  ============================================================
echo.
echo  Locating Python...
echo.

:: Try vllm-env Python first (Palace standard)
if exist "C:\Users\admin\vllm-env\Scripts\python.exe" (
    echo  [OK] Found vllm-env Python
    "C:\Users\admin\vllm-env\Scripts\python.exe" "%~dp0agent-directory.py"
    goto :end
)

:: Try admin-level Python
if exist "C:\Users\admin\AppData\Local\Programs\Python\Python312\python.exe" (
    echo  [OK] Found admin Python 3.12
    "C:\Users\admin\AppData\Local\Programs\Python\Python312\python.exe" "%~dp0agent-directory.py"
    goto :end
)

if exist "C:\Users\admin\AppData\Local\Programs\Python\Python311\python.exe" (
    echo  [OK] Found admin Python 3.11
    "C:\Users\admin\AppData\Local\Programs\Python\Python311\python.exe" "%~dp0agent-directory.py"
    goto :end
)

:: Try current user Python
if exist "C:\Users\stone\AppData\Local\Programs\Python\Python312\python.exe" (
    echo  [OK] Found user Python 3.12
    "C:\Users\stone\AppData\Local\Programs\Python\Python312\python.exe" "%~dp0agent-directory.py"
    goto :end
)

:: Try PATH python
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Found Python on PATH
    python "%~dp0agent-directory.py"
    goto :end
)

:: Try py launcher
where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Found py launcher
    py -3 "%~dp0agent-directory.py"
    goto :end
)

echo  [ERROR] Python not found. Install Python 3.10+ and try again.
pause

:end
echo.
echo  Directory closed.
timeout /t 3 >nul
