@echo off
echo 🚀 BA Agent Vercel Deployment Script
echo ======================================

echo.
echo 📦 Installing Vercel CLI globally...
npm install -g vercel

echo.
echo 🔐 Logging into Vercel...
vercel login

echo.
echo 🏗️  Building frontend...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo 🚀 Deploying to Vercel...
vercel --prod

echo.
echo ✅ Deployment completed!
echo 🌐 Your BA Agent is now live on Vercel!
echo.
pause
