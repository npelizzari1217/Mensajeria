# start.ps1 - Levanta la API en el VPS
# Requisito previo: PostgreSQL nativo instalado como servicio de Windows
# Ejecutar como Administrador en PowerShell
$ErrorActionPreference = "Stop"
# Helper: aborta si el ultimo ejecutable externo fallo
function Assert-LastExit([string]$msg) {
    if ($LASTEXITCODE -ne 0) { throw $msg }
}
# Detener ANTES de tocar node_modules (libera locks de Windows)
Write-Host "=== 0. Deteniendo instancia previa ===" -ForegroundColor Cyan
pm2 delete mensajeria-api -s
Set-Location .\api
Write-Host "=== 1. Instalando dependencias de runtime ===" -ForegroundColor Cyan
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$pkg.dependencies.PSObject.Properties.Remove('@mensajeria/domain')
$pkg.dependencies | Add-Member -Name '@mensajeria/domain' `
    -Value 'file:../../packages/domain' `
    -MemberType NoteProperty -Force
$json = $pkg | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "package.json"), $json)
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install --omit=dev --no-package-lock
Assert-LastExit "npm install fallo"
Write-Host "=== 2. Ajustando Prisma schema para deployment ===" -ForegroundColor Cyan
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "\.\./\.\./node_modules/\.prisma/client",?', ''
[System.IO.File]::WriteAllText((Join-Path $PWD.Path "prisma\schema.prisma"), $schemaFixed)
Write-Host "=== 3. Generando Prisma Client ===" -ForegroundColor Cyan
npx prisma generate
Assert-LastExit "prisma generate fallo"
Write-Host "=== 4. Corriendo migraciones ===" -ForegroundColor Cyan
npx prisma migrate deploy
Assert-LastExit "prisma migrate deploy fallo"
Write-Host "=== 5. Levantando API con pm2 ===" -ForegroundColor Cyan
pm2 start dist/src/main.js --name mensajeria-api
Assert-LastExit "pm2 start fallo"
Write-Host "=== 6. Guardando config de pm2 ===" -ForegroundColor Cyan
pm2 save
Write-Host "Para que pm2 arranque al iniciar Windows:"
Write-Host "  npm install -g pm2-windows-service"
Write-Host "  pm2-service-install"
Write-Host ""
Write-Host "=== LISTO ===" -ForegroundColor Green
Write-Host "API: http://localhost:3000/v1"
Write-Host "Logs: pm2 logs mensajeria-api"
pm2 status