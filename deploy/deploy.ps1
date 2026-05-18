# deploy.ps1 - Deploy completo de Mensajeria (pnpm workspace edition)
# Ejecutar como Administrador en PowerShell desde C:\Mensajeria

$ErrorActionPreference = "Stop"

function Assert-LastExit([string]$msg) {
    if ($LASTEXITCODE -ne 0) { throw $msg }
}

$rootDir = "C:\Mensajeria"

# ── 0. Detener instancia previa + verificar pnpm ──────────────────
Write-Host "=== 0. Deteniendo instancia previa ===" -ForegroundColor Cyan
pm2 delete mensajeria-api -s

Write-Host "=== 0.5. Verificando pnpm ===" -ForegroundColor Cyan
$pnpmVersion = pnpm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Assert-LastExit "No se pudo instalar pnpm"
    $pnpmVersion = pnpm --version
}
Write-Host "    pnpm $pnpmVersion" -ForegroundColor Green

# ── 1. Clean state ───────────────────────────────────────────────
Write-Host "=== 1. Limpiando builds anteriores ===" -ForegroundColor Cyan
Set-Location $rootDir
Remove-Item -Recurse -Force packages\domain\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\domain\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\dist -ErrorAction SilentlyContinue
Remove-Item -Force api\package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\dist -ErrorAction SilentlyContinue

# ── 2. Install workspace deps (desde la raiz, excluyendo mobile) ─
Write-Host "=== 2. Instalando deps del workspace (sin mobile) ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm install --filter "!mobile" --filter "."
Assert-LastExit "pnpm install workspace fallo"

# Verificar que pnpm armo los symlinks/junctions
Write-Host "    Verificando symlink @mensajeria/domain en api..."
$domainLink = "$rootDir\api\node_modules\@mensajeria\domain"
if (-not (Test-Path $domainLink)) {
    Write-Host "    ERROR: $domainLink no existe" -ForegroundColor Red
    Write-Host "    Contenido de api\node_modules:"
    Get-ChildItem "$rootDir\api\node_modules" -ErrorAction SilentlyContinue | Select Name -First 20
    throw "pnpm no creo el symlink de @mensajeria/domain"
}
$linkInfo = Get-Item $domainLink
Write-Host "    Link: $($linkInfo.Name) -> $($linkInfo.Target)" -ForegroundColor Green

# ── 3. Build domain ──────────────────────────────────────────────
Write-Host "=== 3. Build domain ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter "@mensajeria/domain" run build
Assert-LastExit "domain build fallo"

if (-not (Test-Path "$rootDir\packages\domain\dist\index.js")) {
    throw "Domain dist/index.js no fue generado"
}
$jsCount = (Get-ChildItem "$rootDir\packages\domain\dist" -Recurse -Filter *.js).Count
Write-Host "    Domain compilado ($jsCount archivos JS)" -ForegroundColor Green

# Verificar que el symlink ahora ve el dist
$domainDistViaLink = "$rootDir\api\node_modules\@mensajeria\domain\dist\index.js"
if (-not (Test-Path $domainDistViaLink)) {
    Write-Host "    ADVERTENCIA: dist no accesible via symlink en api node_modules" -ForegroundColor Yellow
}

# Verificacion REAL: que node pueda resolver el modulo
Set-Location $rootDir\api
$resolved = node -e "console.log(require.resolve('@mensajeria/domain'))" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    ERROR: node no resuelve @mensajeria/domain desde api/" -ForegroundColor Red
    Write-Host "    $resolved" -ForegroundColor Red
    throw "Domain no resuelve via node"
}
Write-Host "    @mensajeria/domain resuelto: $resolved" -ForegroundColor Green

# ── 4. Prisma generate ───────────────────────────────────────────
Write-Host "=== 4. Prisma: generate ===" -ForegroundColor Cyan
Set-Location $rootDir\api
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "\.\./\.\./node_modules/\.prisma/client",?', ''
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "prisma\schema.prisma"), $schemaFixed)

pnpm exec prisma generate
Assert-LastExit "prisma generate fallo"

# ── 5. Build API ─────────────────────────────────────────────────
Write-Host "=== 5. Build API ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter api run build
Assert-LastExit "nest build fallo"

# ── 6. Prisma migrate deploy ─────────────────────────────────────
Write-Host "=== 6. Prisma: migrate deploy ===" -ForegroundColor Cyan
Set-Location $rootDir\api
pnpm exec prisma migrate deploy
Assert-LastExit "prisma migrate deploy fallo"

# ── 7. Build web ─────────────────────────────────────────────────
Write-Host "=== 7. Build Web ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter web run build
Assert-LastExit "web build fallo"

# ── 8. Iniciar API con pm2 ───────────────────────────────────────
Write-Host "=== 8. Iniciando API ===" -ForegroundColor Cyan
Set-Location $rootDir
pm2 start api/dist/src/main.js --name mensajeria-api
Assert-LastExit "pm2 start fallo"
pm2 save

# ── 9. Verificar API local ───────────────────────────────────────
Write-Host "=== 9. Verificando API local ===" -ForegroundColor Cyan
Start-Sleep -Seconds 3
try {
    $r = Invoke-WebRequest -Uri http://localhost:3000/v1/auth/health -UseBasicParsing -TimeoutSec 5
    Write-Host "    API local responde: $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    WARN: API local no responde aun, ver logs" -ForegroundColor Yellow
    pm2 logs mensajeria-api --lines 10 --nostream
}

# ── 10. Deploy IIS ────────────────────────────────────────────────
Write-Host "=== 10. Deploy Web + Proxy IIS ===" -ForegroundColor Cyan
Set-Location $rootDir

Copy-Item -Force deploy\iis-proxy.web.config C:\inetpub\wwwroot\web.config

$distPath = "C:\inetpub\wwwroot\mensajeria"
if (Test-Path $distPath) { Remove-Item -Recurse -Force $distPath }
Copy-Item -Recurse web\dist $distPath
Remove-WebApplication -Site "Default Web Site" -Name "mensajeria" -ErrorAction SilentlyContinue
New-WebApplication -Site "Default Web Site" -Name "mensajeria" -PhysicalPath $distPath -ApplicationPool "DefaultAppPool"

iisreset

# ── 11. Verificar via IIS ─────────────────────────────────────────
Write-Host "=== 11. Verificando via IIS ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
    $r = Invoke-WebRequest -Uri https://sesitec.net/mensajeria/ -UseBasicParsing -TimeoutSec 10
    Write-Host "    Web: $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    WARN: Web no responde" -ForegroundColor Yellow
}
try {
    $r = Invoke-WebRequest -Uri https://sesitec.net/v1/auth/health -UseBasicParsing -TimeoutSec 10
    Write-Host "    API via IIS: $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    WARN: API via IIS no responde" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DEPLOY COMPLETO ===" -ForegroundColor Green
Write-Host "Frontend: https://sesitec.net/mensajeria/"
Write-Host "API:      https://sesitec.net/v1/"
Write-Host "Logs:     pm2 logs mensajeria-api"
pm2 status
