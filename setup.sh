#!/bin/bash
# Quick start script for AI Tutor Platform

echo "🤖 Starting AI Tutor Platform..."
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found! Creating from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please edit it and add your OpenAI API key!"
    echo ""
fi

echo "📦 Installing backend dependencies..."
cd backend && npm install
echo ""

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo ""

echo "✅ Setup complete!"
echo ""
echo "To start the app, open TWO terminals:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm start"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
echo "🎓 Happy Learning!"
