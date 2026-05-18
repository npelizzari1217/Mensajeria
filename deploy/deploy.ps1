# deploy.ps1 - Deploy completo de Mensajeria
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
pnpm --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Assert-LastExit "No se pudo instalar pnpm"
}
Write-Host "    pnpm $(pnpm --version)" -ForegroundColor Green

# ── 1. Clean state ───────────────────────────────────────────────
Write-Host "=== 1. Limpiando builds anteriores ===" -ForegroundColor Cyan
Set-Location $rootDir
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\domain\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force api\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force web\dist -ErrorAction SilentlyContinue

# ── 2. Install deps (excluye mobile — no se despliega en VPS) ────
Write-Host "=== 2. Instalando dependencias del workspace ===" -ForegroundColor Cyan
Set-Location $rootDir

# Sacar mobile del workspace temporalmente para no bajar react-native
$workspaceYaml = "$rootDir\pnpm-workspace.yaml"
$workspaceOriginal = Get-Content $workspaceYaml -Raw
$workspaceFixed = $workspaceOriginal -replace '\s*-\s*"mobile"\r?\n?', ''
[System.IO.File]::WriteAllText($workspaceYaml, $workspaceFixed)

try {
    pnpm install
    Assert-LastExit "pnpm install fallo"
} finally {
    # Restaurar pnpm-workspace.yaml siempre, incluso si falla
    [System.IO.File]::WriteAllText($workspaceYaml, $workspaceOriginal)
    Write-Host "    pnpm-workspace.yaml restaurado" -ForegroundColor Gray
}

# ── 3. Build domain ──────────────────────────────────────────────
Write-Host "=== 3. Build domain ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter "@mensajeria/domain" run build
Assert-LastExit "domain build fallo"

if (-not (Test-Path "$rootDir\packages\domain\dist\index.js")) {
    throw "Domain dist/index.js no fue generado"
}
$jsCount = (Get-ChildItem "$rootDir\packages\domain\dist" -Recurse -Filter *.js).Count
Write-Host "    Domain compilado ($jsCount JS)" -ForegroundColor Green

# Verificar que node puede resolver @mensajeria/domain desde api/
Set-Location $rootDir\api

# Diagnostico: que creo pnpm en node_modules/@mensajeria
Write-Host "    node_modules\@mensajeria:"
Get-ChildItem "$rootDir\node_modules\@mensajeria" -ErrorAction SilentlyContinue |
    ForEach-Object { Write-Host "      $($_.Name) [LinkType=$($_.LinkType) Target=$($_.Target)]" }

# Si pnpm no creo el link (bug en pnpm v9 Windows), crear junction manualmente
$domainLink = "$rootDir\node_modules\@mensajeria\domain"
if (-not (Test-Path $domainLink)) {
    Write-Host "    pnpm no creo el symlink — creando junction manual..." -ForegroundColor Yellow
    $null = New-Item -ItemType Directory -Path "$rootDir\node_modules\@mensajeria" -Force -ErrorAction SilentlyContinue
    $domainSource = "$rootDir\packages\domain"
    $batFile = "$env:TEMP\mklink_domain.bat"
    # Concatenar quotes explicitamente (evita here-string + escaping)
    $q = "`""
    $batContent = "mklink /J " + $q + $domainLink + $q + " " + $q + $domainSource + $q
    $batContent | Out-File -FilePath $batFile -Encoding ascii
    cmd /c $batFile 2>$null
    Remove-Item $batFile -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Copy-Item -Recurse "$rootDir\packages\domain" $domainLink -ErrorAction Stop
        Write-Host "    Junction fallo, copia directa creada" -ForegroundColor Yellow
    } else {
        Write-Host "    Junction creado" -ForegroundColor Green
    }
}

# Verificacion simple: si el domain compilo, el build de API valida el resolve real
Write-Host "    Verificacion de domain completada; API build validara la resolucion" -ForegroundColor Green

# ── 4. Prisma generate ───────────────────────────────────────────
Write-Host "=== 4. Prisma: generate ===" -ForegroundColor Cyan
Set-Location $rootDir\api
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "[^"]+",?(\r?\n)?', ''
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "prisma\schema.prisma"), $schemaFixed)

pnpm exec prisma generate
Assert-LastExit "prisma generate fallo"

# ── 5. Build API ─────────────────────────────────────────────────
Write-Host "=== 5. Build API ===" -ForegroundColor Cyan
Set-Location $rootDir
pnpm --filter api run build
Assert-LastExit "nest build fallo"

if (-not (Test-Path "$rootDir\api\dist\src\main.js")) {
    throw "api/dist/src/main.js no fue generado"
}
Write-Host "    API compilada" -ForegroundColor Green

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

if (-not (Test-Path "$rootDir\web\dist\index.html")) {
    throw "web/dist/index.html no fue generado"
}
Write-Host "    Web compilada" -ForegroundColor Green

# ── 8. Iniciar API con pm2 ───────────────────────────────────────
Write-Host "=== 8. Iniciando API ===" -ForegroundColor Cyan
Set-Location $rootDir
pm2 start api\dist\src\main.js --name mensajeria-api
Assert-LastExit "pm2 start fallo"
pm2 save

# ── 9. Verificar API local ───────────────────────────────────────
Write-Host "=== 9. Verificando API local ===" -ForegroundColor Cyan
Start-Sleep -Seconds 3
try {
    $r = Invoke-WebRequest -Uri http://localhost:3000/v1/auth/health -UseBasicParsing -TimeoutSec 5
    Write-Host "    API local: $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    WARN: API local no responde aun" -ForegroundColor Yellow
    pm2 logs mensajeria-api --lines 15 --nostream
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
