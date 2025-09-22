@echo off
echo 🔍 Checking Winnipeg Connect Status...
echo.

echo 📱 Frontend (React):
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running at http://localhost:3000
) else (
    echo ❌ Frontend not responding at http://localhost:3000
)

echo.
echo 🔧 Backend (API):
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running at http://localhost:5000
) else (
    echo ❌ Backend not responding at http://localhost:5000
)

echo.
echo 🌐 Open these URLs in your browser:
echo    Frontend: http://localhost:3000
echo    API Health: http://localhost:5000/api/health
echo.
pause
