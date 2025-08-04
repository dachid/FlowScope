# FlowScope Setup Script for Windows (PowerShell)

Write-Host "🔧 Setting up FlowScope development environment..." -ForegroundColor Blue

# Check Node.js version
Write-Host "📦 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Yellow
Set-Location "packages\backend"
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\"

# Create SQLite database
Write-Host "🗄️ Creating SQLite database..." -ForegroundColor Yellow
Set-Location "packages\backend"
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\"

# Build shared package
Write-Host "📦 Building shared package..." -ForegroundColor Yellow
Set-Location "packages\shared"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build shared package" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\"

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Available commands:" -ForegroundColor Cyan
Write-Host "  npm run dev        - Start all services in development mode" -ForegroundColor White
Write-Host "  npm run build      - Build all packages" -ForegroundColor White
Write-Host "  npm test           - Run all tests" -ForegroundColor White
Write-Host "  npm run lint       - Run linting" -ForegroundColor White
Write-Host ""
Write-Host "📁 Package structure:" -ForegroundColor Cyan
Write-Host "  packages/shared    - Shared types and utilities" -ForegroundColor White
Write-Host "  packages/backend   - NestJS API server" -ForegroundColor White
Write-Host "  packages/web-app   - React frontend" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'npm run dev' to start development servers" -ForegroundColor White
Write-Host "  2. Visit http://localhost:3000 for the web app" -ForegroundColor White
Write-Host "  3. API will be available at http://localhost:3001" -ForegroundColor White
