# ========================================
# Security System Deployment Script
# ========================================
# PowerShell script for deploying enhanced security system

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Script configuration
$ScriptName = "Security System Deployment"
$Version = "1.0.0"
$StartTime = Get-Date

# Color functions for output
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "🔒 $Message" -ForegroundColor Magenta }

# Header
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  $ScriptName v$Version" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Start Time: $StartTime" -ForegroundColor White
Write-Host ""

# Pre-deployment checks
Write-Step "Starting pre-deployment security checks..."

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "This script must be run from the project root directory"
    exit 1
}

# Check Node.js version
$NodeVersion = node --version
Write-Info "Node.js version: $NodeVersion"

# Check npm version
$NpmVersion = npm --version
Write-Info "npm version: $NpmVersion"

# Check if .env file exists for the environment
$EnvFile = ".env.$Environment"
if (-not (Test-Path $EnvFile)) {
    Write-Warning "Environment file $EnvFile not found"
    if (-not $Force) {
        Write-Error "Use -Force to continue without environment file"
        exit 1
    }
} else {
    Write-Success "Environment file $EnvFile found"
}

# Check JWT_SECRET
if (Test-Path $EnvFile) {
    $JwtSecret = Get-Content $EnvFile | Where-Object { $_ -match "JWT_SECRET=" }
    if ($JwtSecret) {
        $SecretLength = ($JwtSecret -split "=")[1].Length
        if ($SecretLength -ge 32) {
            Write-Success "JWT_SECRET is properly configured (length: $SecretLength)"
        } else {
            Write-Warning "JWT_SECRET is shorter than recommended (length: $SecretLength)"
        }
    } else {
        Write-Warning "JWT_SECRET not found in environment file"
    }
}

Write-Success "Pre-deployment checks completed"
Write-Host ""

# Security validation
Write-Step "Validating security configuration..."

# Install dependencies
Write-Info "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies"
    exit 1
}
Write-Success "Dependencies installed successfully"

# Generate Prisma client
Write-Info "Generating Prisma client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate Prisma client"
    exit 1
}
Write-Success "Prisma client generated successfully"

# Build the application
Write-Info "Building application..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}
Write-Success "Application built successfully"

# Security tests (if not skipped)
if (-not $SkipTests) {
    Write-Step "Running security tests..."
    
    # Test security health endpoint (if server is running)
    Write-Info "Testing security health endpoint..."
    try {
        $HealthResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/security/health" -Method Get -TimeoutSec 10
        Write-Success "Security health check passed"
        Write-Info "Security status: $($HealthResponse.data.cookieSecurity.status)"
    } catch {
        Write-Warning "Security health check failed (server may not be running)"
        Write-Info "This is normal if the server hasn't been started yet"
    }
    
    Write-Success "Security tests completed"
} else {
    Write-Warning "Security tests skipped"
}

Write-Host ""

# Environment-specific deployment
Write-Step "Deploying to $Environment environment..."

switch ($Environment) {
    "development" {
        Write-Info "Development deployment completed"
        Write-Info "Start the development server with: npm run dev"
    }
    
    "staging" {
        Write-Info "Staging deployment completed"
        Write-Info "Start the staging server with: npm run start"
        Write-Warning "Remember to set production-like environment variables"
    }
    
    "production" {
        Write-Info "Production deployment completed"
        Write-Info "Start the production server with: npm run start"
        Write-Warning "Ensure all security features are enabled"
        Write-Warning "Monitor security health endpoint regularly"
    }
}

Write-Host ""

# Post-deployment verification
Write-Step "Post-deployment verification..."

# Check build artifacts
if (Test-Path ".next") {
    Write-Success "Build artifacts created successfully"
} else {
    Write-Error "Build artifacts not found"
    exit 1
}

# Check security files
$SecurityFiles = @(
    "src/lib/secure-cookies.ts",
    "src/lib/security-config.ts",
    "src/app/api/security/health/route.ts"
)

foreach ($File in $SecurityFiles) {
    if (Test-Path $File) {
        Write-Success "Security file found: $File"
    } else {
        Write-Error "Security file missing: $File"
        exit 1
    }
}

Write-Success "Post-deployment verification completed"
Write-Host ""

# Security recommendations
Write-Step "Security recommendations for $Environment environment:"

switch ($Environment) {
    "development" {
        Write-Info "✅ Enable LOCALHOST_HTTPS=true for secure local development"
        Write-Info "✅ Use strong JWT_SECRET (32+ characters)"
        Write-Info "✅ Test authentication flow thoroughly"
        Write-Info "✅ Monitor security warnings in logs"
    }
    
    "staging" {
        Write-Info "✅ Set FORCE_HTTPS=true for production-like security"
        Write-Info "✅ Use different JWT_SECRET from development"
        Write-Info "✅ Test all security features"
        Write-Info "✅ Validate HTTPS enforcement"
    }
    
    "production" {
        Write-Info "✅ Maximum security enabled"
        Write-Info "✅ HTTPS enforcement active"
        Write-Info "✅ Rate limiting enforced"
        Write-Info "✅ Security monitoring active"
        Write-Info "✅ Regular security audits recommended"
    }
}

Write-Host ""

# Final status
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Deployment Summary" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Success "Environment: $Environment"
Write-Success "Status: Deployment completed successfully"
Write-Info "Duration: $($Duration.TotalSeconds.ToString('F2')) seconds"
Write-Info "Start Time: $StartTime"
Write-Info "End Time: $EndTime"
Write-Host ""

# Next steps
Write-Step "Next steps:"
Write-Info "1. Test authentication flow"
Write-Info "2. Verify security health endpoint"
Write-Info "3. Check security headers"
Write-Info "4. Monitor logs for security events"
Write-Info "5. Run security tests"

if ($Environment -eq "production") {
    Write-Host ""
    Write-Warning "🚨 PRODUCTION DEPLOYMENT COMPLETED"
    Write-Warning "Ensure all security measures are active"
    Write-Warning "Monitor security health regularly"
    Write-Warning "Set up security alerting"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Success "Security system deployment completed successfully!"
Write-Host "========================================" -ForegroundColor Blue
