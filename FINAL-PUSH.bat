@echo off
echo ========================================
echo   FINAL TYPESCRIPT FIX PUSH
echo ========================================
echo.
echo Adding PaymentForm fix...
git add client/src/components/Payment/PaymentForm.tsx
echo.
echo Creating commit...
git commit -m "FINAL FIX: PaymentForm TypeScript errors - use responseData instead of response"
echo.
echo Pushing to GitHub...
git push origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! PUSHED TO GITHUB
    echo ========================================
    echo.
    echo The fix is now on GitHub!
    echo Vercel will show a NEW commit ID (not 94cd982)
    echo Build should succeed this time!
) else (
    echo FAILED TO PUSH - check Git configuration
)
echo.
pause
