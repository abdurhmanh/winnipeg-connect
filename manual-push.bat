@echo off
echo ========================================
echo   Manual GitHub Push - Step by Step
echo ========================================
echo.

echo STEP 1: Stopping any running servers...
taskkill /f /im node.exe >nul 2>&1
echo Done.
echo.

echo STEP 2: Setting up Git configuration (if needed)...
git config --global user.name "abdurhmanh"
git config --global user.email "your.email@example.com"
echo Done.
echo.

echo STEP 3: Initializing Git repository...
git init
echo Done.
echo.

echo STEP 4: Adding all files...
git add .
echo Done.
echo.

echo STEP 5: Checking what files are staged...
echo Files to be committed:
git diff --cached --name-only
echo.

echo STEP 6: Creating commit...
git commit -m "Initial commit: Winnipeg Connect MVP"
echo Done.
echo.

echo STEP 7: Setting main branch...
git branch -M main
echo Done.
echo.

echo STEP 8: Adding remote origin...
git remote add origin https://github.com/abdurhmanh/winnipeg-connect.git
echo Done (might show error if already exists - that's OK).
echo.

echo STEP 9: Checking remote...
git remote -v
echo.

echo STEP 10: Attempting to push...
echo This might ask for authentication...
git push -u origin main
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! 🎉
    echo ========================================
    echo Your project is now on GitHub!
    echo Visit: https://github.com/abdurhmanh/winnipeg-connect
) else (
    echo ========================================
    echo   PUSH FAILED
    echo ========================================
    echo Possible issues:
    echo 1. Authentication required
    echo 2. Repository doesn't exist
    echo 3. Network connection issue
    echo.
    echo Try running: git push -u origin main
    echo manually in a command prompt
)

echo.
pause
