#!/usr/bin/env powershell

# KeretaXpress Deployment Verification Script
Write-Host "🚀 KeretaXpress Deployment Verification" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Check if required files exist
$requiredFiles = @(
    "package.json",
    "next.config.js", 
    "Dockerfile",
    "cloudbuild.yaml",
    ".dockerignore"
)

Write-Host "`n📋 Checking required files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Check Node.js and npm versions
Write-Host "`n📋 Checking environment..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
}

# Check if dependencies are installed
Write-Host "`n📋 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules not found - run 'npm install'" -ForegroundColor Yellow
}

# Check if build works
Write-Host "`n📋 Testing build process..." -ForegroundColor Yellow
Write-Host "Running 'npm run build'..." -ForegroundColor Cyan

try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Build command failed" -ForegroundColor Red
}

# Check Docker (if available)
Write-Host "`n📋 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker version: $dockerVersion" -ForegroundColor Green
    
    Write-Host "🐳 Testing Docker build..." -ForegroundColor Cyan
    docker build -t keretaxpress-test . | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker build successful" -ForegroundColor Green
        # Clean up test image
        docker rmi keretaxpress-test | Out-Null
    } else {
        Write-Host "❌ Docker build failed" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Docker not available" -ForegroundColor Yellow
}

Write-Host "`n🎉 Verification complete!" -ForegroundColor Green
Write-Host "`n📚 Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit your changes to git" -ForegroundColor White
Write-Host "2. Push to your repository" -ForegroundColor White
Write-Host "3. Trigger Cloud Build deployment" -ForegroundColor White
Write-Host "4. Monitor deployment in Google Cloud Console" -ForegroundColor White

Write-Host "`n🔗 Useful commands:" -ForegroundColor Cyan
Write-Host "- Development: npm run dev" -ForegroundColor White
Write-Host "- Build: npm run build" -ForegroundColor White
Write-Host "- Production: npm start" -ForegroundColor White
Write-Host "- Docker build: docker build -t keretaxpress ." -ForegroundColor White
Write-Host "- Docker run: docker run -p 3000:3000 keretaxpress" -ForegroundColor White
