@echo off
echo Pushing payment TypeScript fix...
git add client/src/components/Payment/PaymentForm.tsx
git commit -m "Fix: TypeScript error in PaymentForm - access response.data properly"
git push origin main
echo.
echo Payment fix pushed! Vercel will redeploy automatically.
pause
