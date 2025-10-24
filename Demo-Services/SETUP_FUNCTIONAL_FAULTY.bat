@echo off
echo ========================================
echo   FUNCTIONAL vs FAULTY DEMO SETUP
echo ========================================
echo.

echo [1/5] Installing dependencies...
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

echo [2/5] Starting all services...
start "Orders Service (FUNCTIONAL)" cmd /k "cd orders-service && npm start"
timeout /t 3 /nobreak > nul

start "Booking Service (FAULTY)" cmd /k "cd booking-service && npm start"  
timeout /t 3 /nobreak > nul

start "Payment Service (FUNCTIONAL)" cmd /k "cd payment-service && npm start"
timeout /t 3 /nobreak > nul
echo Services started.
echo.

echo [3/5] Waiting for services to initialize...
timeout /t 5 /nobreak > nul
echo.

echo [4/5] Setting up service states...
echo Making Orders service functional...
curl -X POST http://localhost:4001/orders/recover > nul 2>&1
timeout /t 1 /nobreak > nul

echo Making Payments service functional...
curl -X POST http://localhost:4003/payments/recover > nul 2>&1
timeout /t 1 /nobreak > nul

echo Making Booking service faulty...
curl -X POST http://localhost:4002/bookings/fail > nul 2>&1
timeout /t 1 /nobreak > nul
echo Service states configured.
echo.

echo [5/5] Testing setup...
node test-functional-faulty.js
echo.

echo ========================================
echo   FUNCTIONAL vs FAULTY DEMO READY!
echo ========================================
echo.
echo Services Status:
echo - Orders Service: FUNCTIONAL (Port 4001)
echo - Booking Service: FAULTY (Port 4002)  
echo - Payment Service: FUNCTIONAL (Port 4003)
echo.
echo Next steps:
echo 1. Run full demo: node functional-faulty-demo.js
echo 2. Open Obsidian Dashboard: http://localhost:8080
echo 3. Watch circuit breakers in action
echo 4. Observe resilience patterns
echo.
pause
