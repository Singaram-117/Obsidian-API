@echo off
echo ========================================
echo   OBSIDIAN MROP - QUICK START DEMO
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
echo.

echo [2/4] Installing service dependencies...
cd orders-service
call npm install
cd ..

cd booking-service  
call npm install
cd ..

cd payment-service
call npm install
cd ..
echo.

echo [3/4] Starting all services...
start "Orders Service" cmd /k "cd orders-service && npm start"
timeout /t 2 /nobreak > nul

start "Booking Service" cmd /k "cd booking-service && npm start"  
timeout /t 2 /nobreak > nul

start "Payment Service" cmd /k "cd payment-service && npm start"
timeout /t 3 /nobreak > nul
echo.

echo [4/4] Testing services...
node test-services.js
echo.

echo ========================================
echo   SERVICES STARTED!
echo ========================================
echo.
echo Next steps:
echo 1. Open Obsidian Frontend: http://localhost:8080
echo 2. Register services in the dashboard
echo 3. Run traffic generator: node traffic-generator.js
echo.
pause
