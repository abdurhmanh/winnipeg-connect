@echo off
echo Killing any existing Node processes...
taskkill /f /im node.exe >nul 2>&1

echo Starting backend server...
cd server
start "Backend Server" cmd /c "node index.js"
cd ..

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting frontend server...
cd client
start "Frontend Server" cmd /c "npm start"
cd ..

echo Both servers are starting...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
pause
