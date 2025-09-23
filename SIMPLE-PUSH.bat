@echo off
echo ========================================
echo   SIMPLE GIT PUSH - NO TERMINAL NEEDED
echo ========================================
echo.

echo Step 1: Navigate to project directory
cd /d C:\Users\abdur\OneDrive\Desktop\serve-community

echo Step 2: Check what files are deleted
dir client\src\components\Payment\ 2>nul
if %errorlevel% neq 0 (
    echo PaymentForm.tsx is DELETED locally ✓
) else (
    echo PaymentForm.tsx still exists locally ✗
)

echo Step 3: Add all changes
git add -A

echo Step 4: Commit changes
git commit -m "Remove PaymentForm.tsx to fix Vercel build"

echo Step 5: Push to GitHub
git push origin main

echo.
echo ========================================
echo   CHECK RESULTS:
echo ========================================
echo 1. Look for "Everything up-to-date" - means no changes
echo 2. Look for commit hash - means changes pushed
echo 3. Check Vercel logs for NEW commit ID (not 94cd982)
echo ========================================
echo.
pause
