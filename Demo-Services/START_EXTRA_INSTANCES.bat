@echo off
echo ================================================
echo  Starting Extra Instances for Load Balancing
echo ================================================
echo.

echo Starting Orders Service Instance 2 (Port 4011)...
start "Orders Instance 2" cmd /k "cd orders-service && set PORT=4011 && set INSTANCE_ID=2 && npm start"

timeout /t 2 /nobreak >nul

echo Starting Booking Service Instance 2 (Port 4012)...
start "Booking Instance 2" cmd /k "cd booking-service && set PORT=4012 && set INSTANCE_ID=2 && npm start"

timeout /t 2 /nobreak >nul

echo Starting Payment Service Instance 2 (Port 4013)...
start "Payment Instance 2" cmd /k "cd payment-service && set PORT=4013 && set INSTANCE_ID=2 && npm start"

echo.
echo ================================================
echo  Extra instances started!
echo ================================================
echo  Orders I2:  http://localhost:4011
echo  Booking I2: http://localhost:4012
echo  Payment I2: http://localhost:4013
echo ================================================
echo.
echo Now register these in Obsidian:
echo  1. Go to http://localhost:8080/app/manage
echo  2. Select each service
echo  3. Go to Load Balancing tab
echo  4. Add instances with above URLs
echo.
echo Press any key to close this window...
pause >nul