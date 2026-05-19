@echo off
echo ============================================
echo   CompressIQ AI - Setup Script (Windows)
echo ============================================
echo.

echo [1/3] Setting up Python backend...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
if not exist .env copy .env.example .env
cd ..
echo Backend setup complete.
echo.

echo [2/3] Setting up frontend...
cd frontend
call npm install
cd ..
echo Frontend setup complete.
echo.

echo [3/3] Creating required directories...
if not exist backend\uploads mkdir backend\uploads
if not exist backend\compressed mkdir backend\compressed
if not exist backend\protected mkdir backend\protected
echo Directories ready.
echo.

echo ============================================
echo   Setup complete!
echo   Run: start.bat to launch the application
echo ============================================
pause
