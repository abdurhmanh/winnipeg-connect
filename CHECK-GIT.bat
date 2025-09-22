@echo off
echo ========================================
echo   CHECKING GIT STATUS
echo ========================================
echo.

echo Current directory:
cd
echo.

echo Git status:
git status
echo.

echo Checking what files are modified:
git diff --name-only
echo.

echo Checking staged files:
git diff --cached --name-only
echo.

echo Checking remote:
git remote -v
echo.

echo Last few commits:
git log --oneline -5
echo.

echo ========================================
echo   MANUAL PUSH ATTEMPT
echo ========================================
echo.

echo Adding all files...
git add .
echo.

echo Checking staged files after add:
git diff --cached --name-only
echo.

echo Creating commit...
git commit -m "Fix PaymentForm TypeScript errors - final attempt"
echo.

echo Pushing to GitHub...
git push origin main
echo.

if %errorlevel% equ 0 (
    echo SUCCESS! Changes pushed to GitHub!
) else (
    echo FAILED! Check the error messages above.
)

pause
