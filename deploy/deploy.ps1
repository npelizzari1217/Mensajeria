# deploy.ps1 - Full deploy for Mensajeria on Windows + IIS
# Run as Administrator from C:\Mensajeria

$ErrorActionPreference = "Stop"

function Assert-LastExit([string]$message) {
    if ($LASTEXITCODE -ne 0) {
        throw $message
    }
}

$rootDir = "C:\Mensajeria"

# 0) Stop previous process
Write-Host "=== 0. Stopping previous API ===" -ForegroundColor Cyan
pm2 delete mensajeria-api -s

# 0.5) Ensure pnpm exists
Write-Host "=== 0.5. Checking pnpm ===" -ForegroundColor Cyan
pnpm --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Assert-LastExit "Could not install pnpm"
}
Write-Host "    pnpm $(pnpm --version)" -ForegroundColor Green

# 1) Clean
Write-Host "=== 1. Cleaning old build artifacts ===" -ForegroundColor Cyan
Set-Location $rootDir
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\domain\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\dist -ErrorAction SilentlyContinue

# 2) Install workspace deps without mobile
Write-Host "=== 2. Installing workspace dependencies ===" -ForegroundColor Cyan
$workspaceYaml = "$rootDir\pnpm-workspace.yaml"
$workspaceBackup = "$rootDir\pnpm-workspace.yaml.deploy.bak"
Copy-Item $workspaceYaml $workspaceBackup -Force

try {
    $workspaceLines = Get-Content $workspaceYaml
    $workspaceLines = $workspaceLines | Where-Object { $_.Trim() -ne '- "mobile"' }
    Set-Content -Path $workspaceYaml -Value $workspaceLines -Encoding utf8

    pnpm install
    Assert-LastExit "pnpm install failed"
}
finally {
    Copy-Item $workspaceBackup $workspaceYaml -Force
    Remove-Item $workspaceBackup -Force -ErrorAction SilentlyContinue
    Write-Host "    pnpm-workspace.yaml restored" -ForegroundColor Gray
}

# 3) Build domain
Write-Host "=== 3. Building domain ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter "@mensajeria/domain" run build
Assert-LastExit "domain build failed"

if (-not (Test-Path "$rootDir\packages\domain\dist\index.js")) {
    throw "Domain dist/index.js was not generated"
}
Write-Host "    Domain build OK" -ForegroundColor Green

# Ensure @mensajeria/domain link exists in root node_modules
$domainSource = "$rootDir\packages\domain"
$domainScopeDir = "$rootDir\node_modules\@mensajeria"
$domainLink = "$domainScopeDir\domain"

if (-not (Test-Path $domainLink)) {
    Write-Host "    Creating fallback link for @mensajeria/domain..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $domainScopeDir -Force | Out-Null

    try {
        New-Item -ItemType Junction -Path $domainLink -Target $domainSource -ErrorAction Stop | Out-Null
        Write-Host "    Junction created" -ForegroundColor Green
    }
    catch {
        Copy-Item -Recurse $domainSource $domainLink -ErrorAction Stop
        Write-Host "    Junction failed, copied folder instead" -ForegroundColor Yellow
    }
}

# 4) Prisma generate
Write-Host "=== 4. Prisma generate ===" -ForegroundColor Cyan
Set-Location "$rootDir\api"
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "[^"]+",?(\r?\n)?', ''
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "prisma\schema.prisma"), $schemaFixed)

pnpm exec prisma generate
Assert-LastExit "prisma generate failed"

# 5) Build API
Write-Host "=== 5. Building API ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter api run build
Assert-LastExit "api build failed"

if (-not (Test-Path "$rootDir\api\dist\src\main.js")) {
    throw "api/dist/src/main.js was not generated"
}
Write-Host "    API build OK" -ForegroundColor Green

# 6) Prisma migrate deploy
Write-Host "=== 6. Prisma migrate deploy ===" -ForegroundColor Cyan
Set-Location "$rootDir\api"
pnpm exec prisma migrate deploy
Assert-LastExit "prisma migrate deploy failed"

# 7) Build web
Write-Host "=== 7. Building web ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter web run build
Assert-LastExit "web build failed"

if (-not (Test-Path "$rootDir\web\dist\index.html")) {
    throw "web/dist/index.html was not generated"
}
Write-Host "    Web build OK" -ForegroundColor Green

# 8) Start API
Write-Host "=== 8. Starting API (pm2) ===" -ForegroundColor Cyan
Set-Location $rootDir
pm2 start api\dist\src\main.js --name mensajeria-api
Assert-LastExit "pm2 start failed"
pm2 save

# 9) Check local API
Write-Host "=== 9. Checking local API ===" -ForegroundColor Cyan
Start-Sleep -Seconds 3
try {
    $r = Invoke-WebRequest -Uri http://localhost:3000/v1/auth/health -UseBasicParsing -TimeoutSec 5
    Write-Host "    API local: $($r.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "    WARN: API local still not responding" -ForegroundColor Yellow
    pm2 logs mensajeria-api --lines 15 --nostream
}

# 10) Deploy IIS
Write-Host "=== 10. Deploy web + IIS proxy ===" -ForegroundColor Cyan
Set-Location $rootDir
Copy-Item -Force deploy\iis-proxy.web.config C:\inetpub\wwwroot\web.config

$distPath = "C:\inetpub\wwwroot\mensajeria"
if (Test-Path $distPath) {
    Remove-Item -Recurse -Force $distPath
}
Copy-Item -Recurse web\dist $distPath
Remove-WebApplication -Site "Default Web Site" -Name "mensajeria" -ErrorAction SilentlyContinue
New-WebApplication -Site "Default Web Site" -Name "mensajeria" -PhysicalPath $distPath -ApplicationPool "DefaultAppPool"

iisreset

# 11) Check IIS endpoints
Write-Host "=== 11. Checking IIS endpoints ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
    $r = Invoke-WebRequest -Uri https://sesitec.net/mensajeria/ -UseBasicParsing -TimeoutSec 10
    Write-Host "    Web: $($r.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "    WARN: Web endpoint not responding" -ForegroundColor Yellow
}

try {
    $r = Invoke-WebRequest -Uri https://sesitec.net/v1/auth/health -UseBasicParsing -TimeoutSec 10
    Write-Host "    API via IIS: $($r.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "    WARN: API via IIS not responding" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DEPLOY COMPLETE ===" -ForegroundColor Green
Write-Host "Frontend: https://sesitec.net/mensajeria/"
Write-Host "API:      https://sesitec.net/v1/"
Write-Host "Logs:     pm2 logs mensajeria-api"
pm2 status
