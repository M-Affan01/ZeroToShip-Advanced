@echo off
echo ========================================
echo  Starting All Local Services
echo ========================================

:: Auth Service (port 8000)
echo [1/5] Starting Auth Service on :8000...
start "Auth-8000" /min cmd /c "cd /d D:\CIS Summer Project1\Pro\backend\auth && set REDIS_HOST=localhost&& set DATABASE_URL=postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync&& venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

:: Content Service (port 8001)
echo [2/5] Starting Content Service on :8001...
start "Content-8001" /min cmd /c "cd /d D:\CIS Summer Project1\Pro\services\content_service && set REDIS_HOST=localhost&& set DATABASE_URL=postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync&& venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001"

:: AI Assistant (port 8002)
echo [3/5] Starting AI Assistant on :8002...
start "AI-8002" /min cmd /c "cd /d D:\CIS Summer Project1\Pro\services\ai_assistant && set REDIS_HOST=localhost&& set DATABASE_URL=postgresql://sentinel_admin:S3nt1n3l%232026@localhost:5432/sentinel_sync&& set MILVUS_HOST=localhost&& venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8002"

:: WebSocket Server (port 8080)
echo [4/5] Starting WebSocket Server on :8080...
start "WebSocket-8080" /min cmd /c "cd /d D:\CIS Summer Project1\Pro\services\websocket && set REDIS_HOST=localhost&& node server.js"

:: API Gateway (port 3000)
echo [5/5] Starting API Gateway on :3000...
start "APIGateway-3000" /min cmd /c "cd /d D:\CIS Summer Project1\Pro\api-gateway && set REDIS_HOST=localhost&& set AUTH_SERVICE_URL=http://localhost:8000&& set CONTENT_SERVICE_URL=http://localhost:8001&& set AI_SERVICE_URL=http://localhost:8002&& node server.js"

echo.
echo All services starting in background...
echo Auth:        http://localhost:8000
echo Content:     http://localhost:8001
echo AI Assistant: http://localhost:8002
echo WebSocket:   ws://localhost:8080
echo API Gateway: http://localhost:3000
echo.
echo Waiting 5 seconds for startup...
timeout /t 5 /nobreak >nul
echo Done! Run 'npm run dev' in frontend/ to start the UI.
