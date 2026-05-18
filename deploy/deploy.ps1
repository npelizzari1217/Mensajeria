# deploy.ps1 - Deploy completo de Mensajeria
# Ejecutar como Administrador en PowerShell desde C:\Mensajeria

$ErrorActionPreference = "Stop"

function Assert-LastExit([string]$msg) {
    if ($LASTEXITCODE -ne 0) { throw $msg }
}

$script:RootDir = "C:\Mensajeria"
$script:RootPkgPath = "$RootDir\package.json"
$script:RootPkgBackup = "$RootDir\package.json.deploy-bak"
$script:WorkspaceYamlPath = "$RootDir\pnpm-workspace.yaml"
$script:WorkspaceYamlBackup = "$RootDir\pnpm-workspace.yaml.deploy-bak"

# ── Helper: disable npm workspace detection ─────────────────────
function Disable-WorkspaceDetection {
    Write-Host "    Deshabilitando deteccion de workspace de npm..." -ForegroundColor Yellow
    # Respaldar y eliminar workspaces del root package.json
    Copy-Item $script:RootPkgPath $script:RootPkgBackup -Force
    node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('$($script:RootPkgPath -replace '\\','/')','utf8'));delete p.workspaces;fs.writeFileSync('$($script:RootPkgPath -replace '\\','/')',JSON.stringify(p,null,2))"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo parchear root package.json" }
    # Renombrar pnpm-workspace.yaml si existe
    if (Test-Path $script:WorkspaceYamlPath) {
        Rename-Item $script:WorkspaceYamlPath $script:WorkspaceYamlBackup -Force
    }
    Write-Host "    Workspace detection disabled" -ForegroundColor Green
}

# ── Helper: restore npm workspace detection ────────────────────
function Restore-WorkspaceDetection {
    Write-Host "    Restaurando config de workspace..." -ForegroundColor Yellow
    if (Test-Path $script:RootPkgBackup) {
        Copy-Item $script:RootPkgBackup $script:RootPkgPath -Force
        Remove-Item $script:RootPkgBackup -Force
    }
    if (Test-Path $script:WorkspaceYamlBackup) {
        Rename-Item $script:WorkspaceYamlBackup $script:WorkspaceYamlPath -Force
    }
    Write-Host "    Workspace detection restaurado" -ForegroundColor Green
}

# ── 0. Detener instancia previa ──────────────────────────────────
Write-Host "=== 0. Deteniendo instancia previa ===" -ForegroundColor Cyan
pm2 delete mensajeria-api -s

# ── 0.5. Deshabilitar workspace detection ─────────────────────────
Write-Host "=== 0.5. Preparando npm ===" -ForegroundColor Cyan
Disable-WorkspaceDetection

try {

# ── 1. Clean state ───────────────────────────────────────────────
Write-Host "=== 1. Limpiando builds anteriores ===" -ForegroundColor Cyan
Remove-Item -Recurse -Force packages\domain\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\domain\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\dist -ErrorAction SilentlyContinue
Remove-Item -Force api\package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\dist -ErrorAction SilentlyContinue

# ── 2. Compilar domain package (SIEMPRE, nunca saltear) ─────────
Write-Host "=== 2. Domain package ===" -ForegroundColor Cyan
$domainDir = "C:\Mensajeria\packages\domain"
Write-Host "    Compilando domain..." -ForegroundColor Yellow
Push-Location $domainDir
npm install --no-package-lock
Assert-LastExit "npm install en domain fallo"

Write-Host "    pwd: $(Get-Location)"

# Compilar con npx (maneja .cmd vs shell script automaticamente)
Write-Host "    Ejecutando: npx tsc"
$tscOutput = npx tsc 2>&1
$tscExit = $LASTEXITCODE
Write-Host "    tsc exit code: $tscExit"

if ($tscOutput) {
    Write-Host "    --- tsc output ---"
    $tscOutput | ForEach-Object { Write-Host "    $_" }
    Write-Host "    --- fin tsc ---"
}

if ($tscExit -ne 0) { throw "Domain tsc fallo (exit code: $tscExit)" }

Pop-Location
if (-not (Test-Path "$domainDir\dist\index.js")) {
    Write-Host "    ERROR: dist/index.js no fue generado." -ForegroundColor Red
    Write-Host "    Contenido de $domainDir\dist:" -ForegroundColor Red
    Get-ChildItem "$domainDir\dist" -ErrorAction SilentlyContinue | Select Name
    Write-Host "    Contenido de $domainDir (raiz):" -ForegroundColor Yellow
    Get-ChildItem "$domainDir" -ErrorAction SilentlyContinue | Select Name
    throw "Domain: tsc no genero dist/index.js"
}
Write-Host "    Compilacion OK ($((Get-ChildItem "$domainDir\dist" -Recurse -Filter *.js).Count) archivos JS generados)" -ForegroundColor Green

# ── 3. Instalar deps de api y vincular domain ──────────────────
Write-Host "=== 3. API: dependencias + domain ===" -ForegroundColor Cyan
Set-Location api

# Quitar @mensajeria/domain de dependencias para que npm no intente resolverlo
# (lo vinculamos manualmente porque npm no entiende workspace:*)
$patchScript = @'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.dependencies['@mensajeria/domain'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json parcheado: @mensajeria/domain eliminado');
'@
$patchScript | Out-File -FilePath "patch-pkg.js" -Encoding utf8
node patch-pkg.js
Assert-LastExit "patch package.json fallo"
Remove-Item patch-pkg.js

npm install --no-package-lock
Assert-LastExit "npm install en api fallo"

# Verificar que el domain package compilo correctamente (paso 2)
if (-not (Test-Path "C:\Mensajeria\packages\domain\dist\index.js")) {
    throw "ERROR: C:\Mensajeria\packages\domain\dist\index.js no existe. El domain no compilo en paso 2."
}

Write-Host "    Vinculando @mensajeria/domain..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\@mensajeria\domain" -ErrorAction SilentlyContinue
$null = New-Item -ItemType Directory -Path "node_modules\@mensajeria" -Force -ErrorAction SilentlyContinue

# Intentar junction, con fallback a copia
$linked = $false
cmd /c "mklink /J node_modules\@mensajeria\domain C:\Mensajeria\packages\domain" 2>$null
if ($LASTEXITCODE -eq 0) {
    $linked = $true
    Write-Host "    Junction creado" -ForegroundColor Green
} else {
    Write-Host "    mklink fallo, usando copia directa..." -ForegroundColor Yellow
    Copy-Item -Recurse "C:\Mensajeria\packages\domain" "node_modules\@mensajeria\domain" -ErrorAction Stop
    $linked = $true
}
if (-not $linked) { throw "No se pudo vincular ni copiar @mensajeria/domain" }

if (-not (Test-Path "node_modules\@mensajeria\domain\dist\index.js")) {
    throw "Domain package no esta accesible en node_modules (dist/index.js no encontrado tras vincular)"
}
Write-Host "    @mensajeria/domain verificado" -ForegroundColor Green

# ── 4. Prisma generate (ANTES del build — nest usa typeCheck) ────
Write-Host "=== 4. Prisma: generate ===" -ForegroundColor Cyan
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "\.\./\.\./node_modules/\.prisma/client",?', ''
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "prisma\schema.prisma"), $schemaFixed)

npx prisma generate
Assert-LastExit "prisma generate fallo"

# ── 5. Build API (AHORA con tipos de Prisma generados) ───────────
Write-Host "=== 5. Build API ===" -ForegroundColor Cyan
npx nest build
Assert-LastExit "nest build fallo"

# ── 6. Prisma migrate deploy ─────────────────────────────────────
Write-Host "=== 6. Prisma: migrate deploy ===" -ForegroundColor Cyan
npx prisma migrate deploy
Assert-LastExit "prisma migrate deploy fallo"

Set-Location ..

# ── 7. Build web ─────────────────────────────────────────────────
Write-Host "=== 7. Build Web ===" -ForegroundColor Cyan
Set-Location web
npm install --no-package-lock
npx tsc -b
npx vite build
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

} finally {
    Restore-WorkspaceDetection
}
