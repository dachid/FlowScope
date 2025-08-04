#!/bin/bash

# FlowScope Setup Script
echo "🚀 Setting up FlowScope development environment..."

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Bootstrap lerna packages
echo "🔗 Bootstrapping packages..."
npx lerna bootstrap

# Generate Prisma client
echo "🗄️ Setting up database..."
cd packages/backend
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
cd ../..

echo "✨ Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Update packages/backend/.env with your configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Visit http://localhost:5173 for the web app"
echo "4. Visit http://localhost:3000/api for the backend API"
