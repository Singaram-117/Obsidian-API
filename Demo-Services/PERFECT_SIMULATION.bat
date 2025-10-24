@echo off
echo ========================================
echo   PERFECT SIMULATION WITH OBSIDIAN
echo ========================================
echo.

echo [1/6] Installing dependencies...
cd orders-service
call npm install > nul 2>&1
cd ..

cd booking-service
call npm install > nul 2>&1
cd ..

cd payment-service
call npm install > nul 2>&1
cd ..
echo Dependencies installed.
echo.

echo [2/6] Starting Obsidian Backend...
echo Make sure Obsidian API is running on port 5000
echo If not, run: cd Obsidian-API && npm start
timeout /t 3 /nobreak > nul
echo.

echo [3/6] Starting demo services...
start "Orders Service (FUNCTIONAL)" cmd /k "cd orders-service && npm start"
timeout /t 3 /nobreak > nul

start "Booking Service (FAULTY)" cmd /k "cd booking-service && npm start"  
timeout /t 3 /nobreak > nul

start "Payment Service (FUNCTIONAL)" cmd /k "cd payment-service && npm start"
timeout /t 3 /nobreak > nul
echo Services started.
echo.

echo [4/6] Waiting for services to initialize...
timeout /t 5 /nobreak > nul
echo.

echo [5/6] Setting up perfect simulation with Obsidian...
node health-check-integration.js
echo.

echo [6/6] Perfect simulation ready!
echo ========================================
echo   PERFECT SIMULATION READY!
echo ========================================
echo.
echo Services Status:
echo - Orders Service: FUNCTIONAL (Port 4001)
echo - Booking Service: FAULTY (Port 4002)  
echo - Payment Service: FUNCTIONAL (Port 4003)
echo - Obsidian API: http://localhost:5000
echo - Obsidian Dashboard: http://localhost:8080
echo.
echo Available commands:
echo - node health-check-integration.js --interactive
echo - node health-check-integration.js --monitor
echo.
echo Next steps:
echo 1. Open Obsidian Dashboard: http://localhost:8080
echo 2. Watch real-time health monitoring
echo 3. Observe circuit breakers in action
echo 4. See resilience patterns working
echo.
pause
