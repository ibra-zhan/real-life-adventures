#!/bin/bash

# Real Life Adventures Development Server Startup Script

echo "🚀 Starting Real Life Adventures Development Servers..."
echo ""

# Function to start backend
start_backend() {
    echo "📡 Starting Backend Server..."
    cd backend
    ts-node -r tsconfig-paths/register src/index.ts &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Server..."
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start servers
start_backend
sleep 2
start_frontend

echo ""
echo "🎉 Both servers are running!"
echo "📍 Backend: http://localhost:3001"
echo "📍 Frontend: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
