@echo off
REM FlowScope Setup Script for Windows

echo 🚀 Setting up FlowScope development environment...

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set MAJOR_VERSION=%%i

if %MAJOR_VERSION% LSS 18 (
    echo ❌ Node.js 18+ is required. Current version: %NODE_VERSION%
    exit /b 1
)

echo ✅ Node.js version check passed: %NODE_VERSION%

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Bootstrap lerna packages
echo 🔗 Bootstrapping packages...
call npx lerna bootstrap

REM Generate Prisma client
echo 🗄️ Setting up database...
cd packages\backend
copy .env.example .env
call npx prisma generate
call npx prisma migrate dev --name init
cd ..\..

echo ✨ Setup complete! 🎉
echo.
echo Next steps:
echo 1. Update packages\backend\.env with your configuration
echo 2. Run 'npm run dev' to start development servers
echo 3. Visit http://localhost:5173 for the web app
echo 4. Visit http://localhost:3000/api for the backend API
