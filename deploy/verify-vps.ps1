# verify-vps.ps1 — Diagnóstico completo del VPS para el proyecto Mensajeria
# Ejecutar como Administrador en PowerShell
# Uso: powershell -ExecutionPolicy Bypass -File verify-vps.ps1

$ErrorActionPreference = "Continue"
$script:Pass = 0
$script:Warn = 0
$script:Fail = 0

# ── Helpers ──
function Check($label, $scriptBlock) {
    Write-Host -NoNewline "  [$label] "
    try {
        $ok = & $scriptBlock
        if ($ok) {
            Write-Host "OK" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "FALTA" -ForegroundColor Red
            $script:Fail++
        }
    } catch {
        Write-Host "FALTA (error: $($_.Exception.Message))" -ForegroundColor Red
        $script:Fail++
    }
}

function Warn($label, $scriptBlock) {
    Write-Host -NoNewline "  [$label] "
    try {
        $ok = & $scriptBlock
        if ($ok) {
            Write-Host "OK" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "WARN" -ForegroundColor Yellow
            $script:Warn++
        }
    } catch {
        Write-Host "WARN (error: $($_.Exception.Message))" -ForegroundColor Yellow
        $script:Warn++
    }
}

function Info($message) {
    Write-Host "    $message" -ForegroundColor Gray
}

function Banner($title) {
    Write-Host ""
    Write-Host "═══ $title ═══" -ForegroundColor Cyan
}

# ── Prologo ──
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗"
Write-Host "║  VERIFICACION DE VPS — Proyecto Mensajeria              ║"
Write-Host "║  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                                  ║"
Write-Host "╚══════════════════════════════════════════════════════════╝"

# ─────────────────────────────────────────────────────────────
# 1. SISTEMA OPERATIVO
# ─────────────────────────────────────────────────────────────
Banner "1. SISTEMA OPERATIVO"

$os = Get-CimInstance Win32_OperatingSystem
Info "OS: $($os.Caption) ($($os.Version))"
Info "Arquitectura: $($os.OSArchitecture)"
Info "Memoria total: $([math]::Round($os.TotalVisibleMemorySize / 1MB, 1)) GB"

Check "Ejecutando como Administrador" {
    ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

$isServer = $os.Caption -match "Server"
if (-not $isServer) {
    Info "ADVERTENCIA: No parece ser Windows Server. IIS puede tener limitaciones en versiones cliente."
}

# ─────────────────────────────────────────────────────────────
# 2. IIS — INSTALACION
# ─────────────────────────────────────────────────────────────
Banner "2. IIS — INSTALACION"

$iisFeature = Get-WindowsFeature -Name Web-Server 2>$null
Check "IIS (Web-Server) instalado" { $iisFeature -and $iisFeature.Installed }

if ($iisFeature -and $iisFeature.Installed) {
    $iisVersion = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\InetStp\" -ErrorAction SilentlyContinue
    Info "Version IIS: $($iisVersion.MajorVersion).$($iisVersion.MinorVersion)"
}

# ─────────────────────────────────────────────────────────────
# 3. IIS — MODULOS / CARACTERISTICAS
# ─────────────────────────────────────────────────────────────
Banner "3. IIS — MODULOS Y CARACTERISTICAS"

# URL Rewrite (es un modulo descargable, no viene en Windows Features)
Check "URL Rewrite Module" {
    Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll"
}

# ARR (Application Request Routing) — necesario para proxy inverso
Check "ARR (Application Request Routing)" {
    Test-Path "$env:SystemRoot\System32\inetsrv\requestRouter.dll"
}

# WebSocket Protocol
$wsFeature = Get-WindowsFeature -Name Web-WebSockets 2>$null
Check "WebSocket Protocol (Web-WebSockets)" {
    $wsFeature -and $wsFeature.Installed
}

# Dynamic Content Compression
$dynComp = Get-WindowsFeature -Name Web-Dyn-Compression 2>$null
Warn "Compresion dinamica (Web-Dyn-Compression)" {
    $dynComp -and $dynComp.Installed
}

# Static Content
$statComp = Get-WindowsFeature -Name Web-Stat-Compression 2>$null
Warn "Compresion estatica (Web-Stat-Compression)" {
    $statComp -and $statComp.Installed
}

# ASP.NET Core hosting bundle (necesario si usaras .NET, aca no pero por si acaso)
Warn "ASP.NET Core Hosting Bundle" {
    Test-Path "C:\Program Files\dotnet\shared\Microsoft.AspNetCore.App" -ErrorAction SilentlyContinue
}

# IIS Management Console
$mgmt = Get-WindowsFeature -Name Web-Mgmt-Console 2>$null
Warn "IIS Management Console" {
    $mgmt -and $mgmt.Installed
}

# ─────────────────────────────────────────────────────────────
# 4. IIS — SITIOS y APLICACIONES
# ─────────────────────────────────────────────────────────────
Banner "4. IIS — SITIOS Y APLICACIONES"

try {
    Import-Module WebAdministration -ErrorAction Stop
    Info "Modulo WebAdministration cargado"

    # Default Web Site
    $site = Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue
    Check "Default Web Site existe" { $null -ne $site }

    if ($site) {
        $bindings = Get-WebBinding -Name "Default Web Site"
        Info "Estado: $($site.State)"
        foreach ($b in $bindings) {
            Info "Binding: $($b.protocol)://$($b.bindingInformation)"
        }

        $httpsBinding = $bindings | Where-Object { $_.protocol -eq "https" }
        Check "HTTPS binding configurado" { $null -ne $httpsBinding }

        if ($httpsBinding) {
            Warn "Certificado SSL asignado al binding" {
                $null -ne $httpsBinding.certificateHash
            }
        }
    }

    # Application /mensajeria
    $app = Get-WebApplication -Name "mensajeria" -Site "Default Web Site" -ErrorAction SilentlyContinue
    Check "Aplicacion /mensajeria en IIS" { $null -ne $app }
    if ($app) {
        Info "Physical Path: $($app.PhysicalPath)"
        Check "Directorio fisico de /mensajeria existe" {
            Test-Path $app.PhysicalPath
        }
        $appPool = Get-Item "IIS:\AppPools\$($app.applicationPool)" -ErrorAction SilentlyContinue
        if ($appPool) {
            Info "Application Pool: $($app.applicationPool) — .NET CLR: $($appPool.managedRuntimeVersion)"
        }
    }

    # Application Pool
    $pool = Get-Item "IIS:\AppPools\DefaultAppPool" -ErrorAction SilentlyContinue
    Warn "DefaultAppPool configurado" { $null -ne $pool }

} catch {
    Info "No se pudo cargar WebAdministration. Verificar con IIS Manager manualmente."
}

# ─────────────────────────────────────────────────────────────
# 5. IIS — WEB.CONFIG
# ─────────────────────────────────────────────────────────────
Banner "5. IIS — WEB.CONFIG"

$rootWebConfig = "C:\inetpub\wwwroot\web.config"
Check "web.config proxy raiz (C:\inetpub\wwwroot\web.config)" {
    Test-Path $rootWebConfig
}
if (Test-Path $rootWebConfig) {
    [xml]$rootCfg = Get-Content $rootWebConfig
    $apiProxy = $rootCfg.configuration.'system.webServer'.rewrite.rules.rule |
        Where-Object { $_.name -eq "API-Proxy" }
    Check "  Regla API-Proxy (^v1/(.*) -> localhost:3000)" {
        $null -ne $apiProxy
    }
    $socketProxy = $rootCfg.configuration.'system.webServer'.rewrite.rules.rule |
        Where-Object { $_.name -eq "Socket-Proxy" }
    Check "  Regla Socket-Proxy (^socket.io/(.*) -> localhost:3000)" {
        $null -ne $socketProxy
    }
}

# web.config del frontend
if ($app) {
    $frontendConfig = Join-Path $app.PhysicalPath "web.config"
} else {
    $frontendConfig = "C:\inetpub\wwwroot\mensajeria\web.config"
}
Check "web.config del SPA (en /mensajeria/)" {
    Test-Path $frontendConfig
}
if (Test-Path $frontendConfig) {
    [xml]$feCfg = Get-Content $frontendConfig
    $spaRule = $feCfg.configuration.'system.webServer'.rewrite.rules.rule |
        Where-Object { $_.name -eq "SPA-Fallback" }
    Check "  Regla SPA-Fallback (rewrite a index.html)" {
        $null -ne $spaRule
    }
    $staticCache = $feCfg.configuration.'system.webServer'.staticContent.clientCache
    Check "  Cache estatico configurado" {
        $null -ne $staticCache
    }
}

# ─────────────────────────────────────────────────────────────
# 6. NODE.JS y GESTORES DE PAQUETES
# ─────────────────────────────────────────────────────────────
Banner "6. NODE.JS Y GESTORES DE PAQUETES"

$nodeVersion = $null
try { $nodeVersion = node --version 2>$null } catch {}
Check "Node.js instalado" { $null -ne $nodeVersion }
if ($nodeVersion) {
    Info "Version: $nodeVersion"
    $major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    Check "Node.js >= 20.0.0 (requerido por package.json)" { $major -ge 20 }
}

$npmVersion = $null
try { $npmVersion = npm --version 2>$null } catch {}
Check "npm instalado" { $null -ne $npmVersion }
if ($npmVersion) { Info "Version: $npmVersion" }

$pnpmVersion = $null
try { $pnpmVersion = pnpm --version 2>$null } catch {}
Warn "pnpm instalado (packageManager del proyecto)" { $null -ne $pnpmVersion }
if ($pnpmVersion) { Info "Version: $pnpmVersion" }

# ─────────────────────────────────────────────────────────────
# 7. PM2 (Process Manager)
# ─────────────────────────────────────────────────────────────
Banner "7. PM2 (PROCESS MANAGER)"

$pm2Version = $null
try { $pm2Version = pm2 --version 2>$null } catch {}
Check "pm2 instalado globalmente" { $null -ne $pm2Version }
if ($pm2Version) { Info "Version: $pm2Version" }

$apiProcess = $null
try { $apiProcess = pm2 jlist 2>$null | ConvertFrom-Json | Where-Object { $_.name -eq "mensajeria-api" } } catch {}
if ($pm2Version) {
    Check "Proceso pm2 'mensajeria-api' registrado" { $null -ne $apiProcess }
    if ($apiProcess) {
        Info "Status: $($apiProcess.pm2_env.status)"
        Info "PID: $($apiProcess.pid)"
    }
}

$pm2Startup = $null
try { $pm2Startup = pm2 startup 2>$null | Out-String } catch {}
Warn "pm2 configurado como servicio de arranque (pm2-windows-service)" {
    Get-Service -Name "pm2*" -ErrorAction SilentlyContinue
}

# ─────────────────────────────────────────────────────────────
# 8. POSTGRESQL
# ─────────────────────────────────────────────────────────────
Banner "8. POSTGRESQL"

$pgService = Get-Service -Name "postgres*" -ErrorAction SilentlyContinue
Check "PostgreSQL instalado como servicio" { $null -ne $pgService }

if ($pgService) {
    Info "Servicio: $($pgService.Name) — Estado: $($pgService.Status)"
    Check "PostgreSQL corriendo" { $pgService.Status -eq "Running" }

    $pgInstall = Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations" -ErrorAction SilentlyContinue
    if (-not $pgInstall) {
        $pgInstall = Get-ChildItem "HKLM:\SOFTWARE\PostgreSQL" -ErrorAction SilentlyContinue
    }
    if ($pgInstall) {
        Info "Path: $($pgInstall.Data Directory)"
    }

    # Ver si psql está en PATH
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    Warn "psql en PATH (util para diagnosticos)" { $null -ne $psqlPath }

    # Probar conexion si tenemos psql
    $envFile = "C:\Mensajeria\api\.env"
    if (Test-Path $envFile -ErrorAction SilentlyContinue) {
        Warn "Archivo .env de API existe" { $true }
        $envContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
        if ($envContent -match 'DATABASE_URL\s*=\s*(.+)') {
            $dbUrl = $Matches[1].Trim()
            # Ocultar password
            $dbUrlRedacted = $dbUrl -replace '//[^:]+:[^@]+@', '//***:***@'
            Info "DATABASE_URL configurada: $dbUrlRedacted"
        } else {
            Info "WARN: No se encontro DATABASE_URL en .env" -ForegroundColor Yellow
            $script:Fail++
        }
    } else {
        Info "WARN: C:\Mensajeria\api\.env no existe" -ForegroundColor Yellow
        $script:Fail++
    }
} else {
    Info "PostgreSQL no detectado como servicio."
    Info "Si usas PostgreSQL via Docker, verifica que el contenedor este corriendo."
    # Docker check
    try { $dockerPs = docker ps --format '{{.Names}} {{.Status}}' 2>$null } catch {}
    if ($dockerPs -match "postgres") {
        Info "PostgreSQL detectado en Docker."
    }
}

# ─────────────────────────────────────────────────────────────
# 9. ARCHIVOS DEL PROYECTO
# ─────────────────────────────────────────────────────────────
Banner "9. ARCHIVOS DEL PROYECTO"

$projectRoot = "C:\Mensajeria"
if (-not (Test-Path $projectRoot)) {
    # Buscar alternative locations
    $possibleRoots = @("C:\Mensajeria", "C:\proyectos\mensajeria", "$env:USERPROFILE\Mensajeria",
                       "$env:USERPROFILE\proyectos\mensajeria")
    foreach ($r in $possibleRoots) {
        if (Test-Path $r) { $projectRoot = $r; break }
    }
}

Info "Project Root detectado: $projectRoot"
Check "Directorio del proyecto existe" { Test-Path $projectRoot }

if (Test-Path $projectRoot) {
    Check "package.json raiz" { Test-Path "$projectRoot\package.json" }
    Check "api/package.json" { Test-Path "$projectRoot\api\package.json" }
    Check "web/package.json" { Test-Path "$projectRoot\web\package.json" }
    Check "packages/domain/package.json" { Test-Path "$projectRoot\packages\domain\package.json" }

    # Build outputs
    Check "api/dist compilado (src/main.js)" { Test-Path "$projectRoot\api\dist\src\main.js" }
    Check "web/dist compilado (index.html)" { Test-Path "$projectRoot\web\dist\index.html" }
    Check "domain/dist compilado (index.js)" { Test-Path "$projectRoot\packages\domain\dist\index.js" }

    # Prisma client
    Check "Prisma Client generado" { Test-Path "$projectRoot\api\node_modules\.prisma\client\index.js" }

    # node_modules
    Warn "api/node_modules existe" { Test-Path "$projectRoot\api\node_modules" }
    Warn "web/node_modules existe" { Test-Path "$projectRoot\web\node_modules" }

    # deploy scripts
    Warn "deploy/deploy.ps1" { Test-Path "$projectRoot\deploy\deploy.ps1" }
    Warn "deploy/start.ps1" { Test-Path "$projectRoot\deploy\start.ps1" }
    Warn "deploy/iis-proxy.web.config" { Test-Path "$projectRoot\deploy\iis-proxy.web.config" }
}

# ─────────────────────────────────────────────────────────────
# 10. CONECTIVIDAD DE RED
# ─────────────────────────────────────────────────────────────
Banner "10. CONECTIVIDAD DE RED"

# Verificar que puerto 3000 esta libre o en uso por la API
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
Check "Puerto 3000 en uso (API)" { $null -ne $port3000 }
if ($port3000) {
    Info "Escuchando en 3000: PID $($port3000[0].OwningProcess)"
}

# Firewall — puerto 443 (HTTPS)
$fw443 = Get-NetFirewallRule -DisplayName "*443*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Enabled -eq "True" -and $_.Direction -eq "Inbound" -and $_.Action -eq "Allow" }
Warn "Firewall: puerto 443 permitido (HTTPS)" { $null -ne $fw443 }

# Firewall — puerto 80 (HTTP)
$fw80 = Get-NetFirewallRule -DisplayName "*80*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Enabled -eq "True" -and $_.Direction -eq "Inbound" -and $_.Action -eq "Allow" }
Warn "Firewall: puerto 80 permitido (HTTP)" { $null -ne $fw80 }

# Localhost API test
Warn "API local responde (http://localhost:3000/v1/auth/health)" {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000/v1/auth/health" -UseBasicParsing -TimeoutSec 5
        $r.StatusCode -eq 200
    } catch { $false }
}

# ─────────────────────────────────────────────────────────────
# 11. CONFIGURACION IIS ADICIONAL
# ─────────────────────────────────────────────────────────────
Banner "11. IIS — CONFIGURACION ADICIONAL"

# ARR Proxy enabled
$arrEnabled = Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/proxy" -Name "enabled" -ErrorAction SilentlyContinue
Check "ARR Proxy habilitado (system.webServer/proxy)" { $arrEnabled -and $arrEnabled.Value }

# WebSocket en IIS
$wsIIS = Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/webSocket" -Name "enabled" -ErrorAction SilentlyContinue
Check "WebSocket habilitado en IIS" { $wsIIS -and $wsIIS.Value }

# Application Pool identity y config
if ($appPool) {
    $appPoolPath = "IIS:\AppPools\$($app.applicationPool)"
    $poolIdentity = Get-ItemProperty -Path $appPoolPath -Name "processModel.identityType" -ErrorAction SilentlyContinue
    if ($poolIdentity) {
        Info "AppPool Identity: $($poolIdentity.Value)"
    }
    $poolIdle = Get-ItemProperty -Path $appPoolPath -Name "processModel.idleTimeout" -ErrorAction SilentlyContinue
    if ($poolIdle) {
        Info "Idle Timeout: $($poolIdle.Value) min"
    }
}

# Windows Authentication (si se necesita)
$winAuth = Get-WindowsFeature -Name Web-Windows-Auth 2>$null
Info "Windows Authentication: $(if($winAuth.Installed){'Instalado'}else{'No instalado (no requerido para este proyecto)'})"

# ─────────────────────────────────────────────────────────────
# RESUMEN
# ─────────────────────────────────────────────────────────────
Banner "RESUMEN FINAL"

$total = $script:Pass + $script:Warn + $script:Fail
Write-Host ""
Write-Host "  Resultados: $script:Pass OK  |  $script:Warn WARN  |  $script:Fail FALTA  (de $total checks)" -ForegroundColor White

if ($script:Fail -eq 0 -and $script:Warn -eq 0) {
    Write-Host ""
    Write-Host "  EL VPS ESTA CORRECTAMENTE CONFIGURADO." -ForegroundColor Green
    Write-Host "  Podes ejecutar deploy.ps1 para desplegar el proyecto." -ForegroundColor Green
} elseif ($script:Fail -eq 0) {
    Write-Host ""
    Write-Host "  EL VPS ESTA CASI LISTO. Revisa los WARN arriba." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "  HAY $script:Fail FALTANTES QUE DEBEN CORREGIRSE antes de desplegar." -ForegroundColor Red
    Write-Host ""
    Write-Host "  ACCIONES RECOMENDADAS:" -ForegroundColor White
    Write-Host "  ────────────────────────────────────" -ForegroundColor Gray

    # Sugerencias segun lo que falta
    if (-not $iisFeature.Installed) {
        Write-Host "  • Instalar IIS:" -ForegroundColor Yellow
        Write-Host "    Install-WindowsFeature -Name Web-Server -IncludeManagementTools"
    }
    if (-not (Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll")) {
        Write-Host "  • Instalar URL Rewrite Module:" -ForegroundColor Yellow
        Write-Host "    Descargar de: https://www.iis.net/downloads/microsoft/url-rewrite"
    }
    if (-not (Test-Path "$env:SystemRoot\System32\inetsrv\requestRouter.dll")) {
        Write-Host "  • Instalar ARR (Application Request Routing):" -ForegroundColor Yellow
        Write-Host "    Descargar de: https://www.iis.net/downloads/microsoft/application-request-routing"
    }
    if (-not ($wsFeature.Installed)) {
        Write-Host "  • Instalar WebSocket Protocol:" -ForegroundColor Yellow
        Write-Host "    Install-WindowsFeature -Name Web-WebSockets"
    }
    if (-not $nodeVersion -or $major -lt 20) {
        Write-Host "  • Instalar Node.js >= 20.0.0:" -ForegroundColor Yellow
        Write-Host "    Descargar de: https://nodejs.org/"
    }
    if (-not $pm2Version) {
        Write-Host "  • Instalar pm2:" -ForegroundColor Yellow
        Write-Host "    npm install -g pm2"
    }
    if (-not $pgService) {
        Write-Host "  • Instalar PostgreSQL:" -ForegroundColor Yellow
        Write-Host "    Descargar de: https://www.postgresql.org/download/windows/"
    }
}

Write-Host ""
Write-Host "  Reporte guardado en: $PSScriptRoot\verify-vps-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt" -ForegroundColor Gray
Write-Host ""
