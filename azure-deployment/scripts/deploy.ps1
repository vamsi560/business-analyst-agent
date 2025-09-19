# BA Agent - Azure Deployment Script
# PowerShell script for deploying BA Agent to Azure

param(
    [Parameter(Mandatory=$true)]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$Location,
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTerraform,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDocker,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipFrontend
)

# Configuration
$ProjectName = "ba-agent"
$ResourceGroupName = "rg-$ProjectName-$Environment"
$AppServiceName = "app-$ProjectName-api-$Environment"
$StorageAccountName = "st$ProjectName$Environment"
$KeyVaultName = "kv-$ProjectName-$Environment"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-AzureConnection {
    Write-ColorOutput "Testing Azure connection..." $Blue
    try {
        $context = az account show --query name -o tsv
        if ($context) {
            Write-ColorOutput "Connected to Azure subscription: $context" $Green
            return $true
        }
    }
    catch {
        Write-ColorOutput "Not connected to Azure. Please run 'az login'" $Red
        return $false
    }
}

function Set-AzureSubscription {
    param([string]$SubscriptionId)
    if ($SubscriptionId) {
        Write-ColorOutput "Setting Azure subscription to: $SubscriptionId" $Blue
        az account set --subscription $SubscriptionId
    }
}

function New-ResourceGroup {
    Write-ColorOutput "Creating resource group: $ResourceGroupName" $Blue
    az group create --name $ResourceGroupName --location $Location --tags Environment=$Environment Project=$ProjectName
}

function New-KeyVault {
    Write-ColorOutput "Creating Key Vault: $KeyVaultName" $Blue
    
    # Create Key Vault
    az keyvault create --name $KeyVaultName --resource-group $ResourceGroupName --location $Location --sku standard
    
    # Get current user object ID
    $currentUser = az ad signed-in-user show --query objectId -o tsv
    
    # Set access policy
    az keyvault set-policy --name $KeyVaultName --object-id $currentUser --secret-permissions get list set delete
}

function Set-KeyVaultSecrets {
    Write-ColorOutput "Setting Key Vault secrets..." $Blue
    
    # Prompt for secrets
    $geminiKey = Read-Host "Enter Google Gemini API Key" -AsSecureString
    $adoPat = Read-Host "Enter Azure DevOps PAT" -AsSecureString
    $acsConnection = Read-Host "Enter Azure Communication Services connection string" -AsSecureString
    
    # Convert to plain text for Azure CLI
    $geminiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey))
    $adoPatPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adoPat))
    $acsConnectionPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($acsConnection))
    
    # Store secrets
    az keyvault secret set --vault-name $KeyVaultName --name "GEMINI-API-KEY" --value $geminiKeyPlain
    az keyvault secret set --vault-name $KeyVaultName --name "ADO-PAT" --value $adoPatPlain
    az keyvault secret set --vault-name $KeyVaultName --name "ACS-CONNECTION-STRING" --value $acsConnectionPlain
}

function New-StorageAccount {
    Write-ColorOutput "Creating storage account: $StorageAccountName" $Blue
    
    az storage account create --name $StorageAccountName --resource-group $ResourceGroupName --location $Location --sku Standard_GRS --kind StorageV2
    
    # Create containers
    az storage container create --name "documents" --account-name $StorageAccountName
    az storage container create --name "temp" --account-name $StorageAccountName
    az storage container create --name "backups" --account-name $StorageAccountName
}

function New-SqlDatabase {
    Write-ColorOutput "Creating SQL Database..." $Blue
    
    $sqlServerName = "sql-$ProjectName-$Environment"
    $sqlPassword = Read-Host "Enter SQL Server admin password" -AsSecureString
    $sqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sqlPassword))
    
    # Create SQL Server
    az sql server create --name $sqlServerName --resource-group $ResourceGroupName --location $Location --admin-user sqladmin --admin-password $sqlPasswordPlain
    
    # Create Database
    az sql db create --resource-group $ResourceGroupName --server $sqlServerName --name "db-$ProjectName" --service-objective S2
}

function New-AppService {
    Write-ColorOutput "Creating App Service Plan and Web App..." $Blue
    
    $appServicePlanName = "asp-$ProjectName-$Environment"
    
    # Create App Service Plan
    az appservice plan create --name $appServicePlanName --resource-group $ResourceGroupName --sku P1v3 --is-linux
    
    # Create Web App
    az webapp create --resource-group $ResourceGroupName --plan $appServicePlanName --name $AppServiceName --runtime "PYTHON|3.11"
    
    # Configure app settings
    $storageConnectionString = az storage account show-connection-string --name $StorageAccountName --resource-group $ResourceGroupName --query connectionString -o tsv
    
    az webapp config appsettings set --resource-group $ResourceGroupName --name $AppServiceName --settings `
        WEBSITES_PORT=5000 `
        PYTHON_VERSION=3.11 `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
        AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString `
        GEMINI_API_KEY="@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/GEMINI-API-KEY/)" `
        ADO_PAT="@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/ADO-PAT/)" `
        ACS_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/ACS-CONNECTION-STRING/)"
}

function New-SearchService {
    Write-ColorOutput "Creating Azure Search Service..." $Blue
    
    $searchServiceName = "search-$ProjectName-$Environment"
    az search service create --name $searchServiceName --resource-group $ResourceGroupName --sku standard --replica-count 2 --partition-count 1
}

function New-ApplicationInsights {
    Write-ColorOutput "Creating Application Insights..." $Blue
    
    $appInsightsName = "appi-$ProjectName-$Environment"
    az monitor app-insights component create --app $appInsightsName --location $Location --resource-group $ResourceGroupName --application-type web
}

function New-FrontDoor {
    Write-ColorOutput "Creating Azure Front Door..." $Blue
    
    $frontDoorName = "fd-$ProjectName-$Environment"
    az network front-door create --resource-group $ResourceGroupName --name $frontDoorName --backend-address "$AppServiceName.azurewebsites.net"
}

function Build-DockerImage {
    if ($SkipDocker) {
        Write-ColorOutput "Skipping Docker build..." $Yellow
        return
    }
    
    Write-ColorOutput "Building Docker image..." $Blue
    
    # Navigate to backend directory
    Push-Location "..\backend"
    
    # Build Docker image
    docker build -t ba-agent-api:latest .
    
    # Tag for Azure Container Registry (if using ACR)
    # docker tag ba-agent-api:latest your-acr.azurecr.io/ba-agent-api:latest
    
    Pop-Location
}

function Deploy-Terraform {
    if ($SkipTerraform) {
        Write-ColorOutput "Skipping Terraform deployment..." $Yellow
        return
    }
    
    Write-ColorOutput "Deploying with Terraform..." $Blue
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -var="environment=$Environment" -var="location=$Location"
    
    # Apply deployment
    terraform apply -var="environment=$Environment" -var="location=$Location" -auto-approve
}

function Deploy-Frontend {
    if ($SkipFrontend) {
        Write-ColorOutput "Skipping frontend deployment..." $Yellow
        return
    }
    
    Write-ColorOutput "Deploying frontend to Azure Static Web Apps..." $Blue
    
    # Navigate to frontend directory
    Push-Location "..\frontend"
    
    # Build frontend
    npm run build
    
    # Deploy to Azure Static Web Apps (if configured)
    # az staticwebapp create --name "ba-agent-frontend-$Environment" --resource-group $ResourceGroupName --source . --branch main
    
    Pop-Location
}

function Test-Deployment {
    Write-ColorOutput "Testing deployment..." $Blue
    
    $appUrl = "https://$AppServiceName.azurewebsites.net"
    
    try {
        $response = Invoke-WebRequest -Uri "$appUrl/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "Deployment successful! App is running at: $appUrl" $Green
        }
    }
    catch {
        Write-ColorOutput "Deployment test failed. Please check the application logs." $Red
    }
}

function Show-Summary {
    Write-ColorOutput "`n=== Deployment Summary ===" $Green
    Write-ColorOutput "Environment: $Environment" $Blue
    Write-ColorOutput "Location: $Location" $Blue
    Write-ColorOutput "Resource Group: $ResourceGroupName" $Blue
    Write-ColorOutput "App Service: $AppServiceName" $Blue
    Write-ColorOutput "Storage Account: $StorageAccountName" $Blue
    Write-ColorOutput "Key Vault: $KeyVaultName" $Blue
    Write-ColorOutput "`nNext Steps:" $Yellow
    Write-ColorOutput "1. Configure custom domain" $Blue
    Write-ColorOutput "2. Set up monitoring alerts" $Blue
    Write-ColorOutput "3. Configure backup policies" $Blue
    Write-ColorOutput "4. Set up CI/CD pipeline" $Blue
}

# Main execution
Write-ColorOutput "=== BA Agent Azure Deployment ===" $Green
Write-ColorOutput "Environment: $Environment" $Blue
Write-ColorOutput "Location: $Location" $Blue

# Check Azure connection
if (-not (Test-AzureConnection)) {
    exit 1
}

# Set subscription
Set-AzureSubscription -SubscriptionId $SubscriptionId

# Create resources
New-ResourceGroup
New-KeyVault
Set-KeyVaultSecrets
New-StorageAccount
New-SqlDatabase
New-AppService
New-SearchService
New-ApplicationInsights
New-FrontDoor

# Build and deploy
Build-DockerImage
Deploy-Terraform
Deploy-Frontend

# Test deployment
Test-Deployment

# Show summary
Show-Summary

Write-ColorOutput "`nDeployment completed!" $Green 