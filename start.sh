#!/bin/bash

# VeriTix - Start Frontend & Backend
# This script starts both the backend and frontend servers concurrently

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   VeriTix Development Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if .env exists in backend
if [ ! -f backend/.env ]; then
    echo -e "${RED}❌ Error: backend/.env file not found${NC}"
    echo -e "${YELLOW}Please create backend/.env file first${NC}"
    echo -e "${YELLOW}See backend/.env.example for reference${NC}"
    exit 1
fi

# Check if node_modules exist
if [ ! -d backend/node_modules ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not installed${NC}"
    echo -e "${YELLOW}Running: cd backend && npm install${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d frontend/node_modules ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"
    echo -e "${YELLOW}Running: cd frontend && npm install${NC}"
    cd frontend && npm install && cd ..
fi

echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""

# Trap Ctrl+C and cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo -e "${YELLOW}Check backend.log for details${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "  ${BLUE}→${NC} http://localhost:4000"
echo ""

# Start frontend server
echo -e "${BLUE}Starting frontend server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo -e "${YELLOW}Check frontend.log for details${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "  ${BLUE}→${NC} http://localhost:5173"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Both servers are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}  http://localhost:4000"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Follow logs from both servers
tail -f backend.log frontend.log
