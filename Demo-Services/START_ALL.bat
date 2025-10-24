@echo off
echo ================================================
echo  Starting All Demo Services for Obsidian MROP
echo ================================================
echo.

echo Starting Orders Service (Port 4001)...
start "Orders Service" cmd /k "cd orders-service && set PORT=4001 && set INSTANCE_ID=1 && npm start"

timeout /t 2 /nobreak >nul

echo Starting Booking Service (Port 4002)...
start "Booking Service" cmd /k "cd booking-service && set PORT=4002 && set INSTANCE_ID=1 && npm start"

timeout /t 2 /nobreak >nul

echo Starting Payment Service (Port 4003)...
start "Payment Service" cmd /k "cd payment-service && set PORT=4003 && set INSTANCE_ID=1 && npm start"

echo.
echo ================================================
echo  All services started!
echo ================================================
echo  Orders:  http://localhost:4001
echo  Booking: http://localhost:4002
echo  Payment: http://localhost:4003
echo ================================================
echo.
echo Press any key to close this window...
pause >nul