@echo off
echo ========================================
echo   Checking Git Status
echo ========================================
echo.

echo Current directory:
cd
echo.

echo Checking if Git is installed...
git --version
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo.

echo Checking if this is a Git repository...
git status
if %errorlevel% neq 0 (
    echo This is not a Git repository yet.
    echo.
    echo Do you want to initialize Git now? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        git init
        echo Git initialized successfully!
    )
)
echo.

echo Checking Git configuration...
echo Username: 
git config user.name
echo Email: 
git config user.email
echo.

echo If username/email are empty, set them with:
echo git config --global user.name "Your Name"
echo git config --global user.email "your.email@example.com"
echo.

echo Checking remote repositories...
git remote -v
if %errorlevel% neq 0 (
    echo No remote repositories configured.
)
echo.

echo Checking for staged files...
git diff --cached --name-only
echo.

echo Checking for untracked files...
git ls-files --others --exclude-standard
echo.

pause
