#!/bin/bash
echo "============================================"
echo "  CompressIQ AI - Setup Script (Linux/Mac)"
echo "============================================"

echo "[1/3] Setting up Python backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
[ ! -f .env ] && cp .env.example .env
cd ..
echo "Backend setup complete."

echo "[2/3] Setting up frontend..."
cd frontend
npm install
cd ..
echo "Frontend setup complete."

echo "[3/3] Creating directories..."
mkdir -p backend/uploads backend/compressed backend/protected
echo "Directories ready."

echo "============================================"
echo "  Setup complete! Run: ./start.sh"
echo "============================================"
