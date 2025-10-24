@echo off
echo ================================================
echo  Installing Dependencies for All Demo Services
echo ================================================
echo.

echo Installing Orders Service dependencies...
cd orders-service
call npm install
cd ..
echo Orders Service: DONE!
echo.

echo Installing Booking Service dependencies...
cd booking-service
call npm install
cd ..
echo Booking Service: DONE!
echo.

echo Installing Payment Service dependencies...
cd payment-service
call npm install
cd ..
echo Payment Service: DONE!
echo.

echo ================================================
echo  Installation Complete!
echo ================================================
echo.
echo Next steps:
echo  1. Run START_ALL.bat to start all services
echo  2. Register services in Obsidian
echo  3. Run: node traffic-generator.js
echo.
echo Press any key to exit...
pause >nul