# deploy-unified.ps1
# PowerShell script for unified BA Agent deployment to Vercel

Write-Host "🚀 Starting BA Agent Unified Deployment to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI. Please install manually." -ForegroundColor Red
        exit 1
    }
}

# Check if user is logged in to Vercel
try {
    $whoami = vercel whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "✅ Logged in to Vercel as: $whoami" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please login to Vercel..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to login to Vercel" -ForegroundColor Red
        exit 1
    }
}

# Backup current vercel.json if it exists
if (Test-Path "vercel.json") {
    Write-Host "📄 Backing up existing vercel.json..." -ForegroundColor Yellow
    Copy-Item "vercel.json" "vercel.json.backup" -Force
}

# Copy unified configuration
Write-Host "⚙️ Setting up unified configuration..." -ForegroundColor Yellow
if (!(Test-Path "vercel-unified.json")) {
    Write-Host "❌ vercel-unified.json not found. Please ensure it exists." -ForegroundColor Red
    exit 1
}
Copy-Item "vercel-unified.json" "vercel.json" -Force
Write-Host "✅ Unified configuration set up" -ForegroundColor Green

# Check if frontend build directory exists, if not build it
if (!(Test-Path "frontend\build")) {
    Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
    Push-Location "frontend"
    
    # Install dependencies if node_modules doesn't exist
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    
    # Build frontend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build frontend" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
$deployOutput = vercel --prod --yes 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    
    # Extract URL from output
    $url = $deployOutput | Select-String -Pattern "https://.*\.vercel\.app" | ForEach-Object { $_.Matches[0].Value }
    if ($url) {
        Write-Host "🌐 Your application is deployed at: $url" -ForegroundColor Cyan
        
        # Test health endpoints
        Write-Host "🏥 Testing health endpoints..." -ForegroundColor Yellow
        try {
            $healthResponse = Invoke-RestMethod -Uri "$url/api/health" -Method Get -TimeoutSec 10
            Write-Host "✅ Health check passed: $($healthResponse.status)" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Health check failed. Check deployment logs." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "📱 Application URL: $url" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️ Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Set up your database connection" -ForegroundColor White
Write-Host "3. Configure Azure services (if using)" -ForegroundColor White
Write-Host "4. Test all features to ensure they work correctly" -ForegroundColor White
Write-Host ""
Write-Host "📖 See VERCEL_UNIFIED_DEPLOYMENT_GUIDE.md for detailed setup instructions" -ForegroundColor Cyan

# Display required environment variables
Write-Host ""
Write-Host "🔧 Required Environment Variables:" -ForegroundColor Yellow
$requiredVars = @(
    "GEMINI_API_KEY",
    "DATABASE_URL", 
    "ACS_CONNECTION_STRING",
    "ACS_SENDER_ADDRESS",
    "APPROVAL_RECIPIENT_EMAIL"
)

$optionalVars = @(
    "ONEDRIVE_CLIENT_ID",
    "ONEDRIVE_CLIENT_SECRET", 
    "ONEDRIVE_TENANT_ID",
    "ADO_PERSONAL_ACCESS_TOKEN",
    "ADO_ORGANIZATION_URL",
    "ADO_PROJECT_NAME",
    "LANGCHAIN_ENABLED",
    "OPENAI_API_KEY",
    "QDRANT_HOST",
    "QDRANT_PORT",
    "AZURE_STORAGE_CONNECTION_STRING"
)

Write-Host "Required:" -ForegroundColor Red
foreach ($var in $requiredVars) {
    Write-Host "  - $var" -ForegroundColor White
}

Write-Host "Optional (for enhanced features):" -ForegroundColor Yellow
foreach ($var in $optionalVars) {
    Write-Host "  - $var" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 To add environment variables:" -ForegroundColor Cyan
Write-Host "   1. Go to https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Select your project" -ForegroundColor White
Write-Host "   3. Go to Settings → Environment Variables" -ForegroundColor White
Write-Host "   4. Add the required variables" -ForegroundColor White
Write-Host "   5. Redeploy: vercel --prod" -ForegroundColor White