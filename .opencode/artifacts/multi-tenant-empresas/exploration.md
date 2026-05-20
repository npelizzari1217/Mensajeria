---
id: multi-tenant-empresas-explore
version: 1
created_at: "2026-05-20T18:00:00Z"
---

# Exploration: Multi-Tenant Empresas

## Problem Statement
El sistema actual es single-tenant. No existe separación de datos entre empresas. Un usuario no puede pertenecer a múltiples organizaciones ni los mensajes están segmentados por empresa.

## Current State
- 9 tablas: users, refresh_tokens, messages, message_recipients, attachments, groups, group_members, drafts, conversation_threads
- Arquitectura: Clean Architecture con 4 capas (domain, application, infrastructure, presentation)
- Monorepo: packages/domain, api, web, mobile
- Stack: NestJS + Prisma + PostgreSQL
- 39 use cases, 6 controllers
- Login actual: email+password → JWT con userId + role (sin empresa)

## Affected Bounded Contexts
- **auth**: Login flow cambia (2 pasos), User gana relación con Empresa, TokenPayload incluye empresaId
- **messaging**: Message, Draft, Group, ConversationThread ganan empresa_id. Todos los repos filtran por empresa.
- **shared-kernel**: Nuevo VO EmpresaId

## Affected Modules
| Module | Impact |
|---|---|
| domain/shared | + EmpresaId VO |
| domain/auth/entities/user | + getEmpresas(), sin empresa_id directo |
| domain/messaging/entities/* | + empresaId en create() de Message, Group, Draft |
| domain/messaging/repositories/* | + empresaId en firmas de findBy*, save |
| api/prisma/schema.prisma | + Empresa, UserEmpresa, + empresa_id en 5 tablas |
| api/src/application/auth/* | LoginUseCase (2 pasos), RegisterUserUseCase (+empresa) |
| api/src/application/messaging/* | Todos filtran por empresaId |
| api/src/application/groups/* | Todos filtran por empresaId |
| api/src/application/drafts/* | Todos filtran por empresaId |
| api/src/presentation/auth/* | + select-empresa endpoint, @CurrentUser extrae empresaId |

## Risks
1. **CRITICAL**: Migración de datos — sin empresa default, registros existentes quedan huérfanos
2. **HIGH**: Data leak cross-tenant si un repositorio omite el filtro empresaId
3. **MEDIUM**: Logout forzado para todos los usuarios (refresh tokens sin empresaId se invalidan)
4. **LOW**: Frontend (web + mobile) necesitan selector de empresa post-login

## Recommendation
Implementar Approach B: User-Empresa M:N + empresa_id en tablas de negocio. Arquitectura limpia con EmpresaId como VO en shared-kernel.

## Next Phase
Proceed to propose.
