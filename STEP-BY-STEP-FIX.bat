@echo off
echo ========================================
echo   STEP-BY-STEP GIT DIAGNOSIS
echo ========================================
echo.

echo STEP 1: Kill all Node processes
taskkill /f /im node.exe >nul 2>&1
echo Node processes killed ✓

echo STEP 2: Wait 2 seconds
timeout /t 2 /nobreak >nul

echo STEP 3: Navigate to project
cd /d C:\Users\abdur\OneDrive\Desktop\serve-community
echo Current directory: %CD%

echo STEP 4: Check if PaymentForm exists
if exist "client\src\components\Payment\PaymentForm.tsx" (
    echo PaymentForm.tsx EXISTS - need to delete it
    del "client\src\components\Payment\PaymentForm.tsx"
    echo PaymentForm.tsx DELETED ✓
) else (
    echo PaymentForm.tsx already DELETED ✓
)

echo STEP 5: Check Git status
git status --porcelain
echo.

echo STEP 6: Add all changes
git add -A
echo Changes added ✓

echo STEP 7: Check what will be committed
git diff --cached --name-only
echo.

echo STEP 8: Commit changes
git commit -m "Remove PaymentForm.tsx to fix Vercel build errors"
echo Commit created ✓

echo STEP 9: Push to GitHub
git push origin main
echo.

echo ========================================
echo   RESULTS CHECK:
echo ========================================
echo Look for:
echo ✓ "Everything up-to-date" = No changes to push
echo ✓ Commit hash = Changes pushed successfully
echo ✓ Next Vercel build should show NEW commit ID
echo ========================================
echo.
pause
