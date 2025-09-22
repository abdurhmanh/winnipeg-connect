@echo off
echo PUSHING TYPESCRIPT FIX TO GITHUB...
echo.
git add .
git commit -m "Fix TypeScript fetchCategories parameter error"
git push origin main
echo.
echo DONE! Check Vercel in 2 minutes.
pause
