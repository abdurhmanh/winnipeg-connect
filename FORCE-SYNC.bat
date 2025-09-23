@echo off
echo ========================================
echo   FORCE GIT SYNC - BYPASS TERMINAL ISSUE
echo ========================================
echo.

echo STEP 1: Navigate to project directory
cd /d C:\Users\abdur\OneDrive\Desktop\serve-community

echo STEP 2: Check if PaymentForm exists locally
if exist "client\src\components\Payment\PaymentForm.tsx" (
    echo PaymentForm.tsx EXISTS locally - deleting now
    del "client\src\components\Payment\PaymentForm.tsx"
    echo PaymentForm.tsx DELETED ✓
) else (
    echo PaymentForm.tsx already DELETED locally ✓
)

echo STEP 3: Force add ALL changes (including deletions)
git add -A

echo STEP 4: Check what Git sees as changed
git status --porcelain
echo.

echo STEP 5: If no changes shown, create a dummy change
git status --porcelain | findstr /C:"D " >nul
if %errorlevel% neq 0 (
    echo No deletions detected - creating dummy file to force commit
    echo "// Temporary file to force Git commit" > temp-force-commit.txt
    git add temp-force-commit.txt
    git commit -m "Force commit to sync PaymentForm deletion"
    git rm temp-force-commit.txt
    git add -A
)

echo STEP 6: Commit all changes
git commit -m "Remove PaymentForm.tsx to fix Vercel build - force sync"

echo STEP 7: Push to GitHub
git push origin main

echo.
echo ========================================
echo   CHECK RESULTS:
echo ========================================
echo If you see a commit hash above, it worked!
echo Next Vercel build should show NEW commit ID
echo If still "Everything up-to-date", Git has sync issues
echo ========================================
echo.
pause
