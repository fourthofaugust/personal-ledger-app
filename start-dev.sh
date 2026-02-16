#!/bin/bash

# Personal Ledger - Local Development Startup Script

echo "🚀 Personal Ledger - Development Mode"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Docker and Node.js are installed"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📄 Creating .env.local file..."
    
    # Generate encryption key
    ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    cat > .env.local << EOF
# Personal Ledger - Development Configuration
# Generated on $(date)

# MongoDB Configuration (local Docker)
MONGODB_URI=mongodb://localhost:27017/ledger

# Encryption key for security features
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Node Environment
NODE_ENV=development
EOF
    
    echo "✅ Created .env.local with generated encryption key"
    echo "⚠️  IMPORTANT: Save this key securely!"
    echo ""
else
    echo "✅ Using existing .env.local configuration"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start MongoDB container
echo "🗄️  Starting MongoDB container..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Check MongoDB status
if docker ps | grep -q "personal-ledger-mongodb-dev"; then
    echo "✅ MongoDB is running"
else
    echo "❌ Failed to start MongoDB"
    exit 1
fi

echo ""
echo "🔥 Starting Next.js development server with hot reload..."
echo ""
echo "📱 Application will be available at: http://localhost:3000"
echo ""
echo "📝 Useful commands:"
echo "   Stop MongoDB:  docker-compose -f docker-compose.dev.yml down"
echo "   View logs:     docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop all:      Press Ctrl+C to stop dev server, then run stop command above"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Next.js dev server (this will block and show logs)
npm run dev
