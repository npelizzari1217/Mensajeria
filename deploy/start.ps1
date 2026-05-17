# start.ps1 — Levanta PostgreSQL + API en el VPS
# Ejecutar como Administrador en PowerShell

$ErrorActionPreference = "Stop"

Write-Host "=== 1. Levantando PostgreSQL (Docker) ===" -ForegroundColor Cyan
docker compose -f .\docker-compose.yml up -d

Write-Host "=== 2. Esperando que PostgreSQL este listo ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "=== 3. Instalando dependencias de runtime ===" -ForegroundColor Cyan
Set-Location .\api

# Quitar dependencia workspace y reemplazar por local
(Get-Content package.json -Raw) `
  -replace '\s*"@mensajeria/domain": "workspace:\*",?\r?\n', "`n" `
  -replace '\s*"@mensajeria/domain": "workspace:\*",?\r?\n', "`n" `
  -replace '"dependencies": \{', '"dependencies": {`n    "@mensajeria/domain": "file:../../packages/domain",' `
| Set-Content package.json -NoNewline

npm install --production

Write-Host "=== 4. Ajustando Prisma schema para deployment ===" -ForegroundColor Cyan
# En el monorepo el output es ../../node_modules/.prisma/client
# En el VPS debe ser el default (api/node_modules/.prisma/client)
$schema = Get-Content prisma\schema.prisma -Raw
$schemaFixed = $schema -replace '  output   = "\.\./\.\./node_modules/\.prisma/client",?', ''
Set-Content prisma\schema.prisma -Value $schemaFixed -NoNewline

Write-Host "=== 5. Generando Prisma Client ===" -ForegroundColor Cyan
npx prisma generate

Write-Host "=== 6. Corriendo migraciones ===" -ForegroundColor Cyan
npx prisma migrate deploy

Write-Host "=== 7. Levantando API con pm2 ===" -ForegroundColor Cyan
pm2 delete mensajeria-api -s
pm2 start dist/src/main.js --name mensajeria-api

Write-Host "=== 8. Guardando config de pm2 ===" -ForegroundColor Cyan
pm2 save
Write-Host "Para que pm2 arranque al iniciar Windows:"
Write-Host "  npm install -g pm2-windows-service"
Write-Host "  pm2-service-install"

Write-Host ""
Write-Host "=== LISTO ===" -ForegroundColor Green
Write-Host "API: http://localhost:3000/v1"
Write-Host "Logs: pm2 logs mensajeria-api"
pm2 status
