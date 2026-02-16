#!/bin/bash

# Personal Ledger - Stop Development Environment

echo "🛑 Stopping Personal Ledger Development Environment"
echo "===================================================="
echo ""

# Stop MongoDB container
echo "🗄️  Stopping MongoDB container..."
docker-compose -f docker-compose.dev.yml down

echo ""
echo "✅ Development environment stopped"
echo ""
echo "💡 To start again, run: ./start-dev.sh"
echo ""
