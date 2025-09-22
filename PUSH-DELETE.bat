@echo off
echo Pushing PaymentForm deletion to fix build...
git add .
git commit -m "Remove PaymentForm.tsx to fix TypeScript build errors"
git push origin main
echo.
echo PaymentForm deleted and pushed! 
echo Vercel should show a NEW commit ID now.
pause
