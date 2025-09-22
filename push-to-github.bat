@echo off
echo ========================================
echo   Pushing Winnipeg Connect to GitHub
echo ========================================
echo.

echo Stopping any running servers...
taskkill /f /im node.exe >nul 2>&1
echo.

echo Step 1: Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo Error: Git initialization failed. Make sure Git is installed.
    pause
    exit /b 1
)

echo Step 2: Adding all files to Git...
git add .
if %errorlevel% neq 0 (
    echo Error: Failed to add files to Git.
    pause
    exit /b 1
)

echo Step 3: Creating initial commit...
git commit -m "🎉 Initial commit: Winnipeg Connect MVP

✅ Full-stack marketplace application
- Authentication system with role-based access (Service Seekers & Providers)
- Advanced job posting and browsing with search/filter functionality
- Service provider discovery with comprehensive profiles
- Real-time messaging system with Socket.io
- Google Maps integration (UI ready for API)
- Payment system integration (Stripe ready)
- Responsive Material-UI design
- Complete TypeScript architecture
- MongoDB integration with Mongoose
- JWT authentication with Firebase support
- Comprehensive API with RESTful endpoints
- Professional documentation and setup guides

🚀 Ready for production deployment on Vercel
🏠 Built for the Winnipeg community"

if %errorlevel% neq 0 (
    echo Error: Failed to create commit.
    pause
    exit /b 1
)

echo Step 4: Setting main branch...
git branch -M main
if %errorlevel% neq 0 (
    echo Error: Failed to set main branch.
    pause
    exit /b 1
)

echo Step 5: Adding remote origin...
git remote add origin https://github.com/abdurhmanh/winnipeg-connect.git
if %errorlevel% neq 0 (
    echo Warning: Remote origin might already exist, continuing...
    git remote set-url origin https://github.com/abdurhmanh/winnipeg-connect.git
)

echo Step 6: Pushing to GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo Error: Failed to push to GitHub. 
    echo.
    echo Possible solutions:
    echo 1. Make sure you're logged into Git: git config --global user.name "Your Name"
    echo 2. Make sure you're logged into Git: git config --global user.email "your.email@example.com"
    echo 3. You might need to authenticate with GitHub
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! 🎉
echo ========================================
echo.
echo Your Winnipeg Connect project has been successfully pushed to:
echo https://github.com/abdurhmanh/winnipeg-connect
echo.
echo What's now live on GitHub:
echo ✅ Complete source code
echo ✅ Professional README with documentation
echo ✅ Contributing guidelines
echo ✅ MIT License
echo ✅ Deployment configuration
echo.
echo Next steps:
echo 1. Visit your repository: https://github.com/abdurhmanh/winnipeg-connect
echo 2. Enable GitHub Pages if desired
echo 3. Set up Vercel deployment for live demo
echo 4. Share your project with others!
echo.
echo Repository is ready for:
echo - Portfolio showcase
echo - Collaboration with other developers  
echo - Production deployment
echo - Job applications and interviews
echo.
pause
