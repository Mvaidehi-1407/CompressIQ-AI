#!/bin/bash
echo "Starting CompressIQ AI..."

# Start backend
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID) on http://localhost:5000"
cd ..

sleep 2

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID $FRONTEND_PID) on http://localhost:5173"
cd ..

echo ""
echo "Open: http://localhost:5173"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
