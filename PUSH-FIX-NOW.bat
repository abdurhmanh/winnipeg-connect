@echo off
echo PUSHING PAYMENT FIX TO GITHUB...
echo.
git add .
git commit -m "Fix PaymentForm TypeScript error - access response.data properly"
git push origin main
echo.
echo DONE! New commit pushed. Check Vercel in 2 minutes.
echo You should see a NEW commit ID in Vercel logs (not 94cd982)
pause
