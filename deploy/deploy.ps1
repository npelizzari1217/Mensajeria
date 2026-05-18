# deploy.ps1 - Deploy completo de Mensajeria (pnpm edition)
# Ejecutar como Administrador en PowerShell desde C:\Mensajeria

$ErrorActionPreference = "Stop"

function Assert-LastExit([string]$msg) {
    if ($LASTEXITCODE -ne 0) { throw $msg }
}

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
Remove-Item -Recurse -Force packages\domain\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\domain\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\dist -ErrorAction SilentlyContinue
Remove-Item -Force api\package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\dist -ErrorAction SilentlyContinue

# ── 2. Compilar domain package (SIEMPRE, nunca saltear) ─────────
Write-Host "=== 2. Domain package ===" -ForegroundColor Cyan
$domainDir = "C:\Mensajeria\packages\domain"
Write-Host "    Compilando domain..." -ForegroundColor Yellow
Push-Location $domainDir
pnpm install
Assert-LastExit "pnpm install en domain fallo"

Write-Host "    pwd: $(Get-Location)"
Write-Host "    Ejecutando: pnpm run build"
$tscOutput = pnpm run build 2>&1
$tscExit = $LASTEXITCODE
Write-Host "    tsc exit code: $tscExit"

if ($tscOutput) {
    Write-Host "    --- build output ---"
    $tscOutput | ForEach-Object { Write-Host "    $_" }
    Write-Host "    --- fin build ---"
}

if ($tscExit -ne 0) { throw "Domain build fallo (exit code: $tscExit)" }
Pop-Location

if (-not (Test-Path "$domainDir\dist\index.js")) {
    Write-Host "    ERROR: dist/index.js no fue generado." -ForegroundColor Red
    Write-Host "    Contenido de $domainDir\dist:" -ForegroundColor Red
    Get-ChildItem "$domainDir\dist" -ErrorAction SilentlyContinue | Select Name
    Write-Host "    Contenido de $domainDir (raiz):" -ForegroundColor Yellow
    Get-ChildItem "$domainDir" -ErrorAction SilentlyContinue | Select Name
    throw "Domain: build no genero dist/index.js"
}
Write-Host "    Compilacion OK ($((Get-ChildItem "$domainDir\dist" -Recurse -Filter *.js).Count) archivos JS generados)" -ForegroundColor Green

# ── 3. Instalar deps de API (pnpm resuelve workspace:* nativamente) ──
Write-Host "=== 3. API: dependencias ===" -ForegroundColor Cyan
Set-Location api
pnpm install
Assert-LastExit "pnpm install en api fallo"

# Diagnostico: ver que armo pnpm
Write-Host "    Diagnostico de node_modules/@mensajeria:"
Get-ChildItem "node_modules\@mensajeria" -ErrorAction SilentlyContinue | ForEach-Object {
    $type = if ($_.LinkType) { "$($_.LinkType) -> $($_.Target)" } else { "directorio" }
    Write-Host "      $($_.Name) [$type]"
}

# Verificar resolucion via node (sigue symlinks/junctions correctamente)
$resolved = node -e "try { console.log(require.resolve('@mensajeria/domain')) } catch(e) { console.error(e.message); process.exit(1) }" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    ERROR: node no puede resolver @mensajeria/domain:" -ForegroundColor Red
    Write-Host "    $resolved" -ForegroundColor Red
    throw "Domain package no esta accesible via pnpm workspace"
}
Write-Host "    @mensajeria/domain resuelto en: $resolved" -ForegroundColor Green

# ── 4. Prisma generate (ANTES del build — nest usa typeCheck) ────
Write-Host "=== 4. Prisma: generate ===" -ForegroundColor Cyan
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "\.\./\.\./node_modules/\.prisma/client",?', ''
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "prisma\schema.prisma"), $schemaFixed)

pnpm exec prisma generate
Assert-LastExit "prisma generate fallo"

# ── 5. Build API (AHORA con tipos de Prisma generados) ───────────
Write-Host "=== 5. Build API ===" -ForegroundColor Cyan
pnpm run build
Assert-LastExit "nest build fallo"

# ── 6. Prisma migrate deploy ─────────────────────────────────────
Write-Host "=== 6. Prisma: migrate deploy ===" -ForegroundColor Cyan
pnpm exec prisma migrate deploy
Assert-LastExit "prisma migrate deploy fallo"

Set-Location ..

# ── 7. Build web ─────────────────────────────────────────────────
Write-Host "=== 7. Build Web ===" -ForegroundColor Cyan
Set-Location web
pnpm install
Assert-LastExit "pnpm install en web fallo"
pnpm run build
Assert-LastExit "vite build fallo"
Set-Location ..

# ── 8. Iniciar API con pm2 ───────────────────────────────────────
Write-Host "=== 8. Iniciando API ===" -ForegroundColor Cyan
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

# Proxy en site root (para /v1/* y /socket.io/*)
Copy-Item -Force deploy\iis-proxy.web.config C:\inetpub\wwwroot\web.config

# Web app en /mensajeria
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
