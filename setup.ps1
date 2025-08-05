# FlowScope Setup Script for Windows (PowerShell)
# Updated for independent app architecture

Write-Host "🔧 Setting up FlowScope independent apps..." -ForegroundColor Blue

# Check Node.js version
Write-Host "📦 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install Desktop App dependencies
Write-Host "�️ Setting up Desktop App..." -ForegroundColor Yellow
Set-Location "apps\desktop-app"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Desktop App dependencies" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\"

# Install VS Code Extension dependencies
Write-Host "🔧 Setting up VS Code Extension..." -ForegroundColor Yellow
Set-Location "apps\vscode-extension"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install VS Code Extension dependencies" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\"

# Install Cloud Platform Backend dependencies
Write-Host "☁️ Setting up Cloud Platform Backend..." -ForegroundColor Yellow
Set-Location "apps\cloud-platform\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Cloud Backend dependencies" -ForegroundColor Red
    exit 1
}

# Generate Prisma client
Write-Host "🗄️ Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# Create SQLite database
Write-Host "🗄️ Creating database..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\..\"

# Install Cloud Platform Frontend dependencies
Write-Host "🌐 Setting up Cloud Platform Frontend..." -ForegroundColor Yellow
Set-Location "apps\cloud-platform\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Cloud Frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\..\"

# Install JavaScript SDK dependencies
Write-Host "📦 Setting up JavaScript SDK..." -ForegroundColor Yellow
Set-Location "packages\javascript-sdk"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install JavaScript SDK dependencies" -ForegroundColor Red
    exit 1
}

# Build JavaScript SDK
Write-Host "📦 Building JavaScript SDK..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build JavaScript SDK" -ForegroundColor Red
    exit 1
}
Set-Location "..\..\"

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Available commands for each app:" -ForegroundColor Cyan
Write-Host "  Desktop App:" -ForegroundColor White
Write-Host "    cd apps/desktop-app && npm run dev" -ForegroundColor Gray
Write-Host "  VS Code Extension:" -ForegroundColor White  
Write-Host "    cd apps/vscode-extension && npm run dev" -ForegroundColor Gray
Write-Host "  Cloud Backend:" -ForegroundColor White
Write-Host "    cd apps/cloud-platform/backend && npm run dev" -ForegroundColor Gray
Write-Host "  Cloud Frontend:" -ForegroundColor White
Write-Host "    cd apps/cloud-platform/frontend && npm run dev" -ForegroundColor Gray
Write-Host "  JavaScript SDK:" -ForegroundColor White
Write-Host "    cd packages/javascript-sdk && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📁 Independent App Structure:" -ForegroundColor Cyan
Write-Host "  apps/desktop-app        - Electron desktop application" -ForegroundColor White
Write-Host "  apps/vscode-extension   - VS Code companion extension" -ForegroundColor White
Write-Host "  apps/cloud-platform     - SaaS collaboration platform" -ForegroundColor White
Write-Host "  packages/javascript-sdk - Standalone JavaScript SDK" -ForegroundColor White
Write-Host "  packages/python-sdk     - Standalone Python SDK" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Each app is now completely independent" -ForegroundColor White
Write-Host "  2. Navigate to any app folder and run 'npm run dev'" -ForegroundColor White
Write-Host "  3. Deploy any app without affecting others" -ForegroundColor White
