# start.ps1 — Levanta la API en el VPS
# Requisito previo: PostgreSQL nativo instalado como servicio de Windows
# Ejecutar como Administrador en PowerShell

$ErrorActionPreference = "Stop"

Write-Host "=== 1. Instalando dependencias de runtime ===" -ForegroundColor Cyan
Set-Location .\api

# Modificar package.json via objeto PowerShell (evita bugs de string interpolation)
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$pkg.dependencies.PSObject.Properties.Remove('@mensajeria/domain')
$pkg.dependencies | Add-Member -Name '@mensajeria/domain' `
    -Value 'file:../../packages/domain' `
    -MemberType NoteProperty -Force
$pkg | ConvertTo-Json -Depth 10 | Set-Content package.json -Encoding UTF8

npm install --omit=dev

Write-Host "=== 2. Ajustando Prisma schema para deployment ===" -ForegroundColor Cyan
# En el monorepo el output es ../../node_modules/.prisma/client
# En el VPS debe ser el default (api/node_modules/.prisma/client)
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "\.\./\.\./node_modules/\.prisma/client",?', ''
Set-Content prisma\schema.prisma -Value $schemaFixed -NoNewline

Write-Host "=== 3. Generando Prisma Client ===" -ForegroundColor Cyan
npx prisma generate

Write-Host "=== 4. Corriendo migraciones ===" -ForegroundColor Cyan
npx prisma migrate deploy

Write-Host "=== 5. Levantando API con pm2 ===" -ForegroundColor Cyan
pm2 delete mensajeria-api -s
pm2 start dist/src/main.js --name mensajeria-api

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
