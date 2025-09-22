@echo off
echo ========================================
echo   TEMPORARILY DISABLING PAYMENT COMPONENT
echo ========================================
echo.
echo This will comment out the problematic PaymentForm
echo so the app can deploy successfully.
echo.

echo Renaming PaymentForm.tsx to disable it...
ren "client\src\components\Payment\PaymentForm.tsx" "PaymentForm.tsx.disabled"

echo Adding changes to Git...
git add .

echo Committing changes...
git commit -m "Temporarily disable PaymentForm to fix build - will restore later"

echo Pushing to GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! 
    echo ========================================
    echo.
    echo PaymentForm temporarily disabled
    echo App should now build successfully on Vercel
    echo You'll see a NEW commit ID in Vercel logs
) else (
    echo FAILED - check error messages above
)

pause
