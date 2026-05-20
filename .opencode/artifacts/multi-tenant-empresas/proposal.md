---
id: multi-tenant-empresas-propose
version: 1
lineage:
  derived_from: multi-tenant-empresas-explore
created_at: "2026-05-20T18:05:00Z"
---

# Proposal: Multi-Tenant Empresas

## Intent
Agregar aislamiento de datos por empresa (multi-tenant) al sistema de mensajería. Un usuario podrá pertenecer a una o más empresas. Al loguearse, deberá seleccionar la empresa activa. Todos los mensajes, grupos, borradores e hilos de conversación quedarán vinculados a una empresa y serán invisibles desde otras empresas.

## Scope

### ADDED
- Entidad `Empresa` (nueva tabla `empresas`)
- Value Object `EmpresaId` en shared-kernel
- Tabla de unión `user_empresas` (M:N entre User y Empresa)
- Columna `empresa_id` en: messages, groups, drafts, conversation_threads, refresh_tokens
- Endpoint `POST /v1/auth/select-empresa` para seleccionar empresa post-login
- Login devuelve lista de empresas del usuario

### MODIFIED
- `LoginUseCase`: ahora devuelve `empresas` además del token
- `RegisterUserUseCase`: crea usuario + asigna a empresa
- `TokenPayload`: incluye `empresaId`
- `Message`, `Group`, `Draft`: reciben `empresaId` en `create()`
- Todos los repositories de messaging/groups/drafts: filtran por `empresaId`
- `@CurrentUser()` decorator: extrae `empresaId` del JWT
- `AuthGuard`: valida que el usuario tenga membresía activa en la empresa del token

### REMOVED
- Ninguno

## Affected Specs
- `auth/login` → MODIFIED (agrega selección de empresa)
- `auth/register` → MODIFIED (agrega empresa al registro)
- `messaging/send-message` → MODIFIED (scoped por empresa)
- `messaging/inbox` → MODIFIED (scoped por empresa)
- `groups/create-group` → MODIFIED (scoped por empresa)
- `drafts/save-draft` → MODIFIED (scoped por empresa)

## Risk Estimate
| Risk | Severity | Mitigation |
|---|---|---|
| Migración de datos existentes sin empresa | CRITICAL | Crear empresa "Default" y asignar a todos los registros y usuarios actuales |
| Data leak cross-tenant por query sin filtro | HIGH | Architecture guardian chequea todos los repos |
| Logout masivo (refresh tokens inválidos) | MEDIUM | Comunicar a usuarios, ventana de mantenimiento |
| Frontend necesita selector de empresa | LOW | Se implementa en web (React) y mobile (Expo) |

## Estimated Impact
- **DB**: +2 tablas, +5 FK columns, 1 migration
- **Domain**: +1 VO, ~10 entidades modificadas, ~5 repos modificados
- **Application**: ~20 use cases modificados
- **Presentation**: 1 controller modificado, 1 endpoint nuevo
- **Lines**: ~800-1000 (dominio + infra + tests)

## Dependencies
- Requiere migración de Prisma (nueva migration)
- Requiere deploy coordinado API + frontend
- Los refresh tokens existentes quedan inválidos post-deploy
