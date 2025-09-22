@echo off
echo 🚀 Setting up Winnipeg Connect...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install root dependencies
call npm install

REM Install server dependencies
cd server
call npm install
cd ..

REM Install client dependencies
cd client
call npm install
cd ..

echo ✅ Dependencies installed successfully!

REM Check if .env file exists
if not exist "server\.env" (
    echo 📝 Creating environment file...
    copy "server\env.example" "server\.env"
    echo ⚠️  Please update server\.env with your actual credentials before running the app.
    echo    You'll need:
    echo    - MongoDB connection string
    echo    - JWT secret key
    echo    - Stripe keys (optional for MVP)
    echo    - Cloudinary credentials (optional for MVP)
    echo.
)

echo 🎉 Setup complete!
echo.
echo 🔧 Next steps:
echo 1. Update server\.env with your credentials
echo 2. Run 'npm run dev' to start both frontend and backend
echo 3. Visit http://localhost:3000 to see the app
echo.
echo 📚 Optional: Run 'cd server && npm run seed' to add sample data
echo.
echo 🏃‍♂️ Quick start: npm run dev
pause
