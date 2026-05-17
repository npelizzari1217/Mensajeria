# deploy.ps1 - Deploy completo de Mensajeria
# Ejecutar como Administrador en PowerShell desde C:\Mensajeria

$ErrorActionPreference = "Stop"

function Assert-LastExit([string]$msg) {
    if ($LASTEXITCODE -ne 0) { throw $msg }
}

# ── 0. Detener instancia previa ──────────────────────────────────
Write-Host "=== 0. Deteniendo instancia previa ===" -ForegroundColor Cyan
pm2 delete mensajeria-api -s

# ── 1. Clean state ───────────────────────────────────────────────
Write-Host "=== 1. Limpiando builds anteriores ===" -ForegroundColor Cyan
Remove-Item -Recurse -Force packages\domain\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\domain\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force api\package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\dist -ErrorAction SilentlyContinue

# ── 2. Domain package (skip compilacion si dist ya existe) ─────
Write-Host "=== 2. Domain package ===" -ForegroundColor Cyan
$domainDir = "$PSScriptRoot\..\packages\domain"
if (-not (Test-Path "$domainDir\package.json")) {
    throw "ERROR: No se encontro $domainDir\package.json. Verifica que el repo esta completo en el VPS."
}

if (Test-Path "$domainDir\dist\index.js") {
    Write-Host "    dist/index.js ya existe, salteando compilacion" -ForegroundColor Green
} else {
    Write-Host "    Compilando domain..." -ForegroundColor Yellow
    Set-Location $domainDir
    npm install --no-package-lock
    & "$domainDir\node_modules\.bin\tsc.cmd"
    Assert-LastExit "Domain tsc fallo"
    Set-Location $PSScriptRoot\..
}

# ── 3. Instalar deps de api y buildear ──────────────────────────
Write-Host "=== 3. Build API ===" -ForegroundColor Cyan
Set-Location api

# Parchear package.json via here-string (evita que PS interprete @ y $ en el codigo JS)
$patchScript = @'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.dependencies['@mensajeria/domain'];
pkg.dependencies['@mensajeria/domain'] = 'file:../../packages/domain';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json parcheado: @mensajeria/domain = file:../../packages/domain');
'@
$patchScript | Out-File -FilePath "patch-pkg.js" -Encoding utf8
node patch-pkg.js
Assert-LastExit "patch package.json fallo"
Remove-Item patch-pkg.js

npm install --no-package-lock

# Verificar que el domain package se instalo correctamente
if (-not (Test-Path "node_modules\@mensajeria\domain\dist\index.js")) {
    Write-Host "    ERROR: @mensajeria/domain no se instalo. Contenido:" -ForegroundColor Red
    if (Test-Path "node_modules\@mensajeria\domain") {
        Get-ChildItem node_modules\@mensajeria\domain -Recurse -Depth 2 | Select FullName
    } else {
        Write-Host "    node_modules\@mensajeria\domain NO EXISTE" -ForegroundColor Red
    }
    throw "Domain package no se instalo correctamente"
}
Write-Host "    @mensajeria/domain verificado" -ForegroundColor Green

npx nest build
Assert-LastExit "nest build fallo"

# ── 4. Prisma: quitar output custom, generate, migrate ───────────
Write-Host "=== 4. Prisma: generate + migrate ===" -ForegroundColor Cyan
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "\.\./\.\./node_modules/\.prisma/client",?', ''
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "prisma\schema.prisma"), $schemaFixed)

npx prisma generate
Assert-LastExit "prisma generate fallo"

npx prisma migrate deploy
Assert-LastExit "prisma migrate deploy fallo"

Set-Location ..

# ── 5. Build web ─────────────────────────────────────────────────
Write-Host "=== 5. Build Web ===" -ForegroundColor Cyan
Set-Location web
npm install --no-package-lock
npx tsc -b
npx vite build
Assert-LastExit "vite build fallo"
Set-Location ..

# ── 6. Iniciar API con pm2 ───────────────────────────────────────
Write-Host "=== 6. Iniciando API ===" -ForegroundColor Cyan
pm2 start api/dist/src/main.js --name mensajeria-api
Assert-LastExit "pm2 start fallo"
pm2 save

# ── 7. Verificar API local ───────────────────────────────────────
Write-Host "=== 7. Verificando API local ===" -ForegroundColor Cyan
Start-Sleep -Seconds 3
try {
    $r = Invoke-WebRequest -Uri http://localhost:3000/v1/auth/health -UseBasicParsing -TimeoutSec 5
    Write-Host "    API local responde: $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    WARN: API local no responde aun, ver logs" -ForegroundColor Yellow
    pm2 logs mensajeria-api --lines 10 --nostream
}

# ── 8. Deploy IIS ────────────────────────────────────────────────
Write-Host "=== 8. Deploy Web + Proxy IIS ===" -ForegroundColor Cyan

# Proxy en site root (para /v1/* y /socket.io/*)
Copy-Item -Force deploy\iis-proxy.web.config C:\inetpub\wwwroot\web.config

# Web app en /mensajeria
$distPath = "C:\inetpub\wwwroot\mensajeria"
if (Test-Path $distPath) { Remove-Item -Recurse -Force $distPath }
Copy-Item -Recurse web\dist $distPath
Remove-WebApplication -Site "Default Web Site" -Name "mensajeria" -ErrorAction SilentlyContinue
New-WebApplication -Site "Default Web Site" -Name "mensajeria" -PhysicalPath $distPath -ApplicationPool "DefaultAppPool"

iisreset

# ── 9. Verificar via IIS ─────────────────────────────────────────
Write-Host "=== 9. Verificando via IIS ===" -ForegroundColor Cyan
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
