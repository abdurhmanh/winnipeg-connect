@echo off
echo ========================================
echo   Winnipeg Connect - GitHub Setup
echo ========================================
echo.

echo Step 1: Initializing Git repository...
git init
echo.

echo Step 2: Adding all files...
git add .
echo.

echo Step 3: Creating initial commit...
git commit -m "🎉 Initial commit: Winnipeg Connect MVP

✅ Features implemented:
- Authentication system with role-based access
- Job posting and browsing with advanced search
- Service provider discovery with filtering
- Real-time messaging with Socket.io
- Google Maps integration (UI ready)
- Payment system (Stripe ready)
- Responsive Material-UI design
- Full-stack TypeScript architecture

🚀 Ready for production deployment!"
echo.

echo Step 4: Setting up main branch...
git branch -M main
echo.

echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Create a new repository on GitHub:
echo    - Go to https://github.com/new
echo    - Repository name: winnipeg-connect
echo    - Description: Full-stack marketplace connecting service providers and seekers in Winnipeg
echo    - Make it Public
echo    - Don't initialize with README (we already have one)
echo    - Click "Create repository"
echo.
echo 2. Copy your repository URL and run:
echo    git remote add origin https://github.com/YOURUSERNAME/winnipeg-connect.git
echo    git push -u origin main
echo.
echo 3. Your project will be live on GitHub!
echo.
echo ========================================
echo   Repository Features Ready:
echo ========================================
echo ✅ README.md with comprehensive documentation
echo ✅ .gitignore with all necessary exclusions
echo ✅ CONTRIBUTING.md with development guidelines
echo ✅ LICENSE file (MIT License)
echo ✅ Vercel deployment configuration
echo ✅ Professional commit history
echo.
pause
