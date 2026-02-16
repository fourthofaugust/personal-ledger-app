#!/bin/bash

# Personal Ledger - Interactive Startup Script

echo "🚀 Personal Ledger Application Setup"
echo "===================================="
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

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists and ask if user wants to reconfigure
if [ -f .env ]; then
    echo "⚠️  An .env file already exists."
    read -p "Do you want to reconfigure? (y/N): " reconfigure
    if [[ ! $reconfigure =~ ^[Yy]$ ]]; then
        echo ""
        echo "Using existing configuration..."
        
        # Extract port from existing .env
        if grep -q "^APP_PORT=" .env; then
            EXISTING_PORT=$(grep "^APP_PORT=" .env | cut -d '=' -f2)
            echo "Current port: $EXISTING_PORT"
        fi
        
        echo ""
        read -p "Press Enter to start the application..."
        
        # Start the application
        echo ""
        echo "🔨 Building and starting containers..."
        docker-compose up -d --build
        
        # Wait for services
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 5
        
        # Check status
        echo ""
        echo "📊 Service Status:"
        docker-compose ps
        
        echo ""
        echo "✅ Personal Ledger is running!"
        echo ""
        if [ -n "$EXISTING_PORT" ]; then
            echo "📱 Access the application at: http://localhost:$EXISTING_PORT"
        else
            echo "📱 Access the application at: http://localhost:3000"
        fi
        echo ""
        exit 0
    fi
fi

# Interactive configuration
echo "📝 Configuration Setup"
echo "====================="
echo ""

# Ask for port
while true; do
    read -p "Enter the port to run the application (default: 3000): " APP_PORT
    APP_PORT=${APP_PORT:-3000}
    
    # Validate port number
    if [[ "$APP_PORT" =~ ^[0-9]+$ ]] && [ "$APP_PORT" -ge 1 ] && [ "$APP_PORT" -le 65535 ]; then
        # Check if port is already in use
        if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":$APP_PORT.*LISTEN"; then
            echo "⚠️  Port $APP_PORT is already in use. Please choose a different port."
        else
            echo "✅ Port $APP_PORT is available"
            break
        fi
    else
        echo "❌ Invalid port number. Please enter a number between 1 and 65535."
    fi
done

echo ""

# Ask for encryption key
while true; do
    read -p "Enter an encryption key (min 16 characters, leave empty to generate): " ENCRYPTION_KEY
    
    if [ -z "$ENCRYPTION_KEY" ]; then
        # Generate a random encryption key
        ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        echo "✅ Generated encryption key: $ENCRYPTION_KEY"
        echo "⚠️  IMPORTANT: Save this key securely! You'll need it if you move your data."
        break
    elif [ ${#ENCRYPTION_KEY} -ge 16 ]; then
        echo "✅ Encryption key accepted"
        break
    else
        echo "❌ Encryption key must be at least 16 characters long."
    fi
done

echo ""

# Create .env file
echo "📄 Creating .env file..."
cat > .env << EOF
# Personal Ledger Configuration
# Generated on $(date)

# Application Port
APP_PORT=$APP_PORT

# Encryption key for security features
ENCRYPTION_KEY=$ENCRYPTION_KEY

# MongoDB Configuration
MONGODB_URI=mongodb://mongodb:27017/ledger

# Node Environment
NODE_ENV=production
EOF

echo "✅ Configuration saved to .env"
echo ""

# Update docker-compose.yml port mapping
echo "🔧 Updating docker-compose configuration..."
if [ -f docker-compose.yml ]; then
    # Create a backup
    cp docker-compose.yml docker-compose.yml.backup
    
    # Update the port mapping
    sed -i.tmp "s/- \"[0-9]*:3000\"/- \"$APP_PORT:3000\"/" docker-compose.yml
    rm -f docker-compose.yml.tmp
    
    echo "✅ Port configuration updated"
fi

echo ""
echo "📋 Configuration Summary:"
echo "========================"
echo "Port: $APP_PORT"
echo "Encryption Key: ${ENCRYPTION_KEY:0:8}... (hidden)"
echo "MongoDB: mongodb://mongodb:27017/ledger"
echo ""

read -p "Press Enter to start the application..."

# Start the application
echo ""
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Personal Ledger is running!"
echo ""
echo "📱 Access the application at: http://localhost:$APP_PORT"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop app:     docker-compose down"
echo "   Restart:      docker-compose restart"
echo ""
echo "💾 Your configuration is saved in .env"
echo "   Keep this file safe, especially the encryption key!"
echo ""
