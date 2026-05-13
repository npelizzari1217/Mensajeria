---
title: "Proposal: mensajeria-core"
change: mensajeria-core
phase: propose
artifact: proposal
status: draft
---

# Proposal: mensajeria-core

## Intent
Greenfield messaging system. Establecer la base del monorepo, dominio compartido, auth, y CRUD de mensajería para habilitar entregas incrementales posteriores (tiempo real, adjuntos, mobile).

## Scope

### In Scope
- Monorepo con Turborepo (api/, web/, packages/domain/)
- Value Objects: UserId, MessageId, Email, Subject, MessageBody, Role
- Entidades: User, Message, MessageRecipient, ConversationThread
- AuthN: registro + login con JWT + bcrypt
- Roles: Admin, Supervisor, Técnico, Usuario
- CRUD mensajes: crear (1 destinatario), listar inbox/sent, marcar leído
- API REST endpoints protegidos (NestJS + auth guard)
- Web básica React (login, inbox, compose, detalle)
- Prisma schema + migraciones PostgreSQL
- Tests unitarios de dominio + aplicación

### Out of Scope
- WebSockets / tiempo real → Entrega 3
- Adjuntos / FileStorage → Entrega 2
- Destinatarios múltiples → Entrega 2
- Hilos / respuestas → Entrega 3
- Mobile (Expo) → Entrega 4
- Offline / SyncEngine → Entrega 4
- Push notifications → Entrega 4
- Búsqueda full-text → Entrega 3

## Capabilities

### New Capabilities
- `user-auth`: registro, login, JWT emisión/validación, roles RBAC
- `messaging-core`: enviar mensaje (1 destinatario), listar inbox/sent, marcar leído

### Modified Capabilities
- None (greenfield)

## Approach
Clean Architecture estricta: **Domain** (VOs + entidades + repository ports) → **Application** (use cases + DTOs + ports) → **Infrastructure** (PrismaRepository, JWT adapter, bcrypt hasher) → **Presentation** (NestJS REST controllers + AuthGuard).

Web React consume API REST via fetch + React Context para sesión. Turborepo orquesta builds entre packages con dependencias internas.

Orden de construcción: Domain → Application → Infrastructure → API → Web → Tests.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `packages/domain/` | New | VOs, entidades, repository ports, eventos |
| `packages/domain/src/auth/` | New | User entity, Role VO, AuthPort, PasswordHasher |
| `packages/domain/src/messaging/` | New | Message, MessageRecipient, ConversationThread, ThreadId, MessageId |
| `api/src/application/` | New | Use cases: Register, Login, SendMessage, GetInbox, MarkAsRead |
| `api/src/infrastructure/` | New | PrismaUserRepo, PrismaMessageRepo, JwtService, BcryptHasher |
| `api/src/presentation/` | New | AuthController, MessageController, AuthGuard, DTOs |
| `api/prisma/schema.prisma` | New | Tablas: users, messages, message_recipients, conversation_threads |
| `web/` | New | React + Vite: LoginPage, InboxPage, ComposePage, MessageDetailPage |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Monorepo config inicial (Turborepo) | Low | Usar `create-turbo` + template repetible |
| Prisma migrations conflictos en equipo | Low | Migraciones tempranas + seed data + documented |
| Scope creep (querer agregar WS ahora) | Medium | Out of Scope explícito. Validar con stakeholder |
| Auth JWT security misconfig | Low | bcrypt + jsonwebtoken + httpOnly cookies. No localStorage. Tests de security |

## Rollback Plan
- Feature branch sobre main. PR único estimado ~800-1000 LOC.
- Rollback pre-merge: cerrar PR sin merge.
- Rollback post-merge: `git revert <merge-commit-sha>`.
- DB: `prisma migrate down` si se necesita revertir schema.

## Dependencies
- Node.js 20+, PostgreSQL 16+
- Turborepo, NestJS, Prisma, React 19, Vite
- bcrypt, jsonwebtoken, class-validator, zod

## Success Criteria
- [ ] Usuario se registra → login → recibe JWT válido
- [ ] Usuario autenticado envía mensaje a otro usuario
- [ ] Destinatario ve el mensaje en su inbox
- [ ] Destinatario marca como leído → status persiste en DB
- [ ] Usuario no autenticado recibe 401 en endpoints protegidos
- [ ] Tests unitarios pasan (domain entities + application use cases)
- [ ] API responde < 200ms en endpoints críticos (listar inbox)
