@echo off
setlocal enabledelayedexpansion

node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not installed. Installing Node.js...
    powershell -Command "& { iwr https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi -OutFile node.msi }"
    msiexec /i node.msi /quiet /norestart
    del node.msi
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    set NODE_VERSION=!NODE_VERSION:~1!
    for /f "tokens=1 delims=." %%a in ("!NODE_VERSION!") do set NODE_MAJOR=%%a
    if !NODE_MAJOR! lss 20 (
        echo Установленная версия Node.js ниже 20. Обновление...
        powershell -Command "& { iwr https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi -OutFile node.msi }"
        msiexec /i node.msi /quiet /norestart
        del node.msi
    ) else (
        echo Node.js !NODE_VERSION! already installed
    )
)

git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Git installing...
    powershell -Command "& { iwr https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe -OutFile git.exe }"
    git.exe /VERYSILENT /NORESTART
    del git.exe
) else (
    echo Git already installed
)

timeout /t 5

echo Executing git pull...
git pull

echo Executing npm...
call npm install

echo Starting...
start npm start web

timeout /t 10

echo Opening browser...
start http://localhost

echo Done
pause