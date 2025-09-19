# BA Agent - Unified Vercel Deployment Guide

## 🎯 Overview

This guide explains how to deploy the BA Agent application to Vercel as a **single unified deployment** that includes both frontend and backend, eliminating the need for separate deployments while preserving all features.

## 🏗️ Architecture

The unified deployment uses:
- **Frontend**: React app served as static files from `/frontend/build`
- **Backend**: Python Flask API served via Vercel Functions from `/api`
- **Routing**: Single `vercel.json` that routes `/api/*` to backend and everything else to frontend
- **Single Domain**: Both frontend and backend accessible from the same Vercel URL

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
You'll need these environment variables configured in Vercel:

**Required Variables:**
```bash
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_connection_string
ACS_CONNECTION_STRING=your_azure_communication_services_connection
ACS_SENDER_ADDRESS=your_azure_sender_email
APPROVAL_RECIPIENT_EMAIL=recipient@example.com
```

**Optional Variables (for enhanced features):**
```bash
# OneDrive Integration
ONEDRIVE_CLIENT_ID=your_onedrive_client_id
ONEDRIVE_CLIENT_SECRET=your_onedrive_client_secret
ONEDRIVE_TENANT_ID=your_azure_tenant_id

# Azure DevOps Integration  
ADO_PERSONAL_ACCESS_TOKEN=your_ado_pat
ADO_ORGANIZATION_URL=https://dev.azure.com/your-org
ADO_PROJECT_NAME=your_project_name

# LangChain Integration
LANGCHAIN_ENABLED=true
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Qdrant Vector Database (if using external)
QDRANT_HOST=your_qdrant_host
QDRANT_PORT=6333
QDRANT_ENABLED=true

# Azure Storage (for file uploads)
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection
AZURE_STORAGE_CONTAINER_NAME=ba-agent-files
```

### 2. Database Setup
- **Development**: Uses SQLite (automatic)
- **Production**: Configure PostgreSQL via `DATABASE_URL`
- **Recommended**: Use Vercel Postgres or external PostgreSQL service

## 🚀 Deployment Steps

### Step 1: Prepare Repository

1. **Clean existing Vercel deployments** (if any):
   ```bash
   # List existing projects
   vercel ls
   
   # Remove old deployments
   vercel remove your-old-frontend-project
   vercel remove your-old-backend-project
   ```

2. **Update root vercel.json**:
   ```bash
   # Replace the current vercel.json with the unified version
   cp vercel-unified.json vercel.json
   ```

3. **Verify file structure**:
   ```
   ba_agent/
   ├── vercel.json                 # Unified configuration
   ├── api/
   │   ├── app.py                  # Entry point for backend
   │   ├── vercel_main.py          # Main backend logic
   │   ├── vercel_config.py        # Vercel-specific config
   │   └── requirements.txt        # Python dependencies
   ├── frontend/
   │   ├── package.json            # Frontend dependencies
   │   ├── src/                    # React source code
   │   └── build/                  # Built frontend (auto-generated)
   └── backend/                    # Original backend code (imported by api/)
   ```

### Step 2: Install Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

### Step 3: Deploy to Vercel

1. **Deploy from root directory**:
   ```bash
   # Navigate to project root
   cd c:\Users\backofficeuser\Pictures\ba_agent
   
   # Deploy to Vercel
   vercel --prod
   ```

2. **Follow prompts**:
   - Set up and deploy? **Y**
   - Which scope? **Select your account/team**
   - Project name: **ba-agent** (or your preferred name)
   - Directory: **./  (current directory)**
   - Override settings? **N** (unless you need custom settings)

### Step 4: Configure Environment Variables

1. **Via Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables
   - Add all required variables from the checklist above

2. **Via CLI** (alternative):
   ```bash
   # Add environment variables via CLI
   vercel env add GEMINI_API_KEY production
   vercel env add DATABASE_URL production
   vercel env add ACS_CONNECTION_STRING production
   # ... add all other variables
   ```

3. **Redeploy after setting variables**:
   ```bash
   vercel --prod
   ```

## 🧪 Testing the Deployment

### 1. Health Checks

Test these endpoints after deployment:

```bash
# Replace YOUR_VERCEL_URL with your actual Vercel URL
curl https://YOUR_VERCEL_URL.vercel.app/api/health
curl https://YOUR_VERCEL_URL.vercel.app/api/vercel-health
curl https://YOUR_VERCEL_URL.vercel.app/api/test
```

Expected responses:
- Health endpoints should return `{"status": "healthy"}`
- Test endpoint should return application info

### 2. Frontend Verification

- Visit `https://YOUR_VERCEL_URL.vercel.app`
- Verify the React application loads correctly
- Check that static assets (CSS, JS, images) load properly

### 3. Feature Testing

Test key features:
- **Document Upload**: Try uploading a document
- **Document Analysis**: Test the analysis functionality
- **Document Generation**: Test document generation
- **Authentication** (if enabled): Test login/logout

## 📁 File Organization

### Critical Files for Deployment

**Root Configuration:**
- `vercel.json` - Unified deployment configuration
- `package.json` - Not needed (using frontend/package.json)

**API Directory:**
- `api/app.py` - Vercel entry point
- `api/vercel_main.py` - Main backend application
- `api/vercel_config.py` - Vercel-specific configuration
- `api/requirements.txt` - Python dependencies

**Frontend Directory:**
- `frontend/package.json` - React dependencies and build scripts
- `frontend/src/` - React source code
- `frontend/build/` - Built frontend (generated during deployment)

## 🔧 Troubleshooting

### Common Issues

1. **Function Timeout**:
   - Increase `maxDuration` in `vercel.json` functions config
   - Optimize slow operations

2. **Import Errors**:
   - Ensure all dependencies are in `api/requirements.txt`
   - Check Python path configuration

3. **CORS Issues**:
   - Verify CORS headers in `vercel.json`
   - Check `after_request` handlers in Flask app

4. **Environment Variables Not Working**:
   - Verify variables are set in Vercel dashboard
   - Redeploy after adding variables
   - Check variable names match exactly

5. **Frontend Not Loading**:
   - Verify build process completed successfully
   - Check that `frontend/build` directory exists
   - Verify routing configuration

### Debug Commands

```bash
# Check deployment logs
vercel logs YOUR_DEPLOYMENT_URL

# Check build logs
vercel logs --follow

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

## 🔄 Continuous Deployment

### GitHub Integration

1. **Connect GitHub repository**:
   - In Vercel dashboard, go to Settings → Git
   - Connect your GitHub repository

2. **Auto-deploy on push**:
   - Production deployments trigger on pushes to `main` branch
   - Preview deployments trigger on PRs

3. **Branch protection**:
   - Set up branch protection rules in GitHub
   - Require successful Vercel builds before merging

### Environment-Specific Deployments

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Specific environment
vercel --target preview
vercel --target production
```

## 📊 Monitoring and Analytics

### Vercel Analytics

1. **Enable Analytics**:
   - Go to Vercel Dashboard → Analytics
   - Enable Web Analytics for your project

2. **Monitor Performance**:
   - Track Core Web Vitals
   - Monitor function execution times
   - Track error rates

### Application Monitoring

1. **Health Checks**:
   - Set up external monitoring for `/api/health`
   - Monitor database connectivity
   - Track API response times

2. **Error Tracking**:
   - Implement error logging in backend
   - Monitor Vercel function logs
   - Set up alerts for failures

## 🛡️ Security Best Practices

### Environment Variables

1. **Use Vercel's secure variable storage**
2. **Never commit secrets to repository**
3. **Rotate API keys regularly**
4. **Use different keys for different environments**

### API Security

1. **Enable CORS properly**
2. **Implement rate limiting**
3. **Validate all inputs**
4. **Use HTTPS only**

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## 🎉 Success Indicators

Your deployment is successful when:

✅ **Frontend loads at root URL**  
✅ **API endpoints respond at /api/***  
✅ **Health checks return healthy status**  
✅ **Document upload/analysis works**  
✅ **All configured features are functional**  
✅ **No console errors in browser**  
✅ **Environment variables are properly loaded**

## 🔄 Deployment Script

For automated deployment, use this PowerShell script:

```powershell
# deploy-unified.ps1
Write-Host "🚀 Starting BA Agent Unified Deployment to Vercel..." -ForegroundColor Green

# Check Vercel CLI
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Verify login
try {
    vercel whoami | Out-Null
} catch {
    Write-Host "Please login to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Copy unified config
Write-Host "Setting up unified configuration..." -ForegroundColor Yellow
Copy-Item "vercel-unified.json" "vercel.json" -Force

# Deploy
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "Don't forget to configure environment variables in Vercel dashboard" -ForegroundColor Yellow
```

Save this as `deploy-unified.ps1` and run: `.\deploy-unified.ps1`