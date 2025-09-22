@echo off
echo Pushing TypeScript fix to GitHub...
echo.

git add client/src/App.tsx
git add client/src/store/slices/categoriesSlice.ts
git commit -m "Fix: TypeScript fetchCategories parameter error for Vercel build"
git push origin main

echo.
echo Fix pushed! Vercel will redeploy automatically.
pause
