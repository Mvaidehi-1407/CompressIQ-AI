@echo off
echo ============================================
echo   CompressIQ AI - Starting Application
echo ============================================
echo.
echo Starting Flask backend on http://localhost:5000
echo Starting Vite frontend on http://localhost:5173
echo.

start "CompressIQ Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"
timeout /t 3 /nobreak >nul
start "CompressIQ Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Open: http://localhost:5173
echo.
pause
