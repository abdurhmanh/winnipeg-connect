@echo off
echo ========================================
echo   EMERGENCY PUSH - FORCE SYNC TO GITHUB
echo ========================================
echo.

echo Current directory:
cd
echo.

echo Checking Git status:
git status
echo.

echo Force adding all changes:
git add -A
echo.

echo Creating emergency commit:
git commit -m "EMERGENCY: Remove PaymentForm to fix Vercel build - commit should change from 94cd982"
echo.

echo Force pushing to GitHub:
git push origin main --force-with-lease
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! EMERGENCY PUSH COMPLETED
    echo ========================================
    echo.
    echo Changes should now be on GitHub
    echo Next Vercel build will show NEW commit ID
    echo Build should succeed without PaymentForm errors
) else (
    echo ========================================
    echo   PUSH FAILED - MANUAL ACTION NEEDED
    echo ========================================
    echo.
    echo Please run these commands manually:
    echo cd C:\Users\abdur\OneDrive\Desktop\serve-community
    echo git add -A
    echo git commit -m "Remove PaymentForm to fix build"
    echo git push origin main
)

echo.
pause
