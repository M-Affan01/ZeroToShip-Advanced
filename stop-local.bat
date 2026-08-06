@echo off
echo Stopping all local services...
taskkill /FI "WINDOWTITLE eq Auth-8000*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Content-8001*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AI-8002*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq WebSocket-8080*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq APIGateway-3000*" /F >nul 2>&1
echo Done!
