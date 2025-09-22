@echo off
echo ========================================
echo   Fixing TypeScript Errors & Pushing
echo ========================================
echo.

echo Adding fixed files to Git...
git add .
echo.

echo Creating commit with fix...
git commit -m "🔧 Fix TypeScript build errors

- Fixed fetchCategories() parameter issue
- Made async thunk parameters properly optional
- Resolved Vercel deployment compilation errors

✅ Ready for successful deployment"
echo.

echo Pushing to GitHub...
git push origin main
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! 🎉
    echo ========================================
    echo.
    echo Fixed files pushed to GitHub!
    echo Vercel will automatically redeploy.
    echo.
    echo Check your Vercel dashboard for the new deployment.
    echo Your app should be live in 2-3 minutes!
) else (
    echo ========================================
    echo   PUSH FAILED
    echo ========================================
    echo Please run manually:
    echo git add .
    echo git commit -m "Fix TypeScript errors"
    echo git push origin main
)

echo.
pause
