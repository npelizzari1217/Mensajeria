# setup-iis.ps1 — Configura el Virtual Directory /mensajeria en IIS
# Ejecutar como Administrador en PowerShell

$siteName = "Default Web Site"
$distPath = "C:\inetpub\wwwroot\mensajeria"

Write-Host "=== 1. Copiando dist/ a $distPath ===" -ForegroundColor Cyan
if (Test-Path $distPath) { Remove-Item -Recurse -Force $distPath }
Copy-Item -Recurse ".\web\dist" $distPath

Write-Host "=== 2. Creando Application /mensajeria en IIS ===" -ForegroundColor Cyan
Remove-WebApplication -Site $siteName -Name "mensajeria" -ErrorAction SilentlyContinue
New-WebApplication -Site $siteName -Name "mensajeria" -PhysicalPath $distPath -ApplicationPool "DefaultAppPool"

Write-Host "=== 3. Recargando IIS ===" -ForegroundColor Cyan
iisreset

Write-Host ""
Write-Host "=== LISTO ===" -ForegroundColor Green
Write-Host "Frontend: https://sesitec.net/mensajeria/"
Write-Host "API:      https://sesitec.net/v1/"
