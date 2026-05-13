# Tasks: mensajeria-core

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,800–3,200 (impl + tests) |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 (Domain) → PR 2 (Auth API) → PR 3 (Messaging API) → PR 4 (Web) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain layer + tests | PR 1 → main | packages/domain/ standalone. Zero deps. |
| 2 | Auth backend + Prisma schema (users) + shared infra | PR 2 → main | Depends on PR 1 (domain types). |
| 3 | Messaging backend + Prisma schema (messages) + seed | PR 3 → main | Depends on PR 1 + PR 2 (auth infra, guards). |
| 4 | Web frontend (React) | PR 4 → main | Depends on PR 2 + PR 3 (API running). |

---

## Phase 1: Domain Foundation (Work Unit 1)

### T-001: Shared foundation — VOs, Errors, Result
- **Capability**: infra
- **Capa**: domain
- **Dependencias**: ninguna
- **Archivos**:
  - `packages/domain/src/shared/value-objects/user-id.ts`
  - `packages/domain/src/shared/value-objects/message-id.ts`
  - `packages/domain/src/shared/value-objects/email.ts`
  - `packages/domain/src/shared/value-objects/role.ts`
  - `packages/domain/src/shared/value-objects/subject.ts`
  - `packages/domain/src/shared/value-objects/message-body.ts`
  - `packages/domain/src/shared/value-objects/message-status.ts`
  - `packages/domain/src/shared/errors/domain-error.ts`
  - `packages/domain/src/shared/errors/not-found-error.ts`
  - `packages/domain/src/shared/result.ts`
  - `packages/domain/src/index.ts`
- **Criterios**:
  - [x] VOs creados con `.create()` factory, `.get()` accessor, `.equals()` comparación
  - [x] Email valida formato, Subject valida 5–200 chars
  - [x] Result<T,E> con `ok()`, `err()`, `.isOk()`, `.isErr()`, `.unwrap()`, `.unwrapOr()`
  - [x] DomainError base class + NotFoundError subclass
  - [x] Tests unitarios para cada VO y Result
- **LOC**: ~250

### T-002: Auth domain — User entity, Password, UserIdentity, UserRegistered, UserRepository
- **Capability**: user-auth
- **Capa**: domain
- **Dependencias**: T-001
- **Archivos**:
  - `packages/domain/src/auth/entities/user.ts`
  - `packages/domain/src/auth/value-objects/password.ts`
  - `packages/domain/src/auth/value-objects/user-identity.ts`
  - `packages/domain/src/auth/events/user-registered.ts`
  - `packages/domain/src/auth/repositories/user-repository.ts`
- **Criterios**:
  - [x] User entity con `.create()` factory + `reconstruct()` para persistencia
  - [x] Password VO con hash validation (mín 8 chars) + comparación
  - [x] UserIdentity expone userId + role para authZ checks
  - [x] UserRepository port con `save()`, `findById()`, `findByEmail()`, `existsByEmail()`
  - [x] Tests unitarios de User.create(), password validation
- **LOC**: ~180

### T-003: Messaging domain — Message, MessageRecipient, ConversationThread, events, repository
- **Capability**: messaging-core
- **Capa**: domain
- **Dependencias**: T-001
- **Archivos**:
  - `packages/domain/src/messaging/entities/message.ts`
  - `packages/domain/src/messaging/entities/message-recipient.ts`
  - `packages/domain/src/messaging/entities/conversation-thread.ts`
  - `packages/domain/src/messaging/value-objects/thread-id.ts`
  - `packages/domain/src/messaging/events/message-sent.ts`
  - `packages/domain/src/messaging/repositories/message-repository.ts`
- **Criterios**:
  - [x] Message entity con sender, recipients, subject, body, thread relation
  - [x] MessageRecipient con status (PENDING/DELIVERED/READ) + markRead()
  - [x] ConversationThread con subject + messageCount
  - [x] MessageRepository port con `save()`, `findByRecipient()`, `findBySender()`, `findById()`, `saveRecipient()`
  - [x] Tests unitarios de creación y markRead
- **LOC**: ~200

---

## Phase 2: Application Layer (Work Units 2 & 3)

### T-004: Auth ports + DTOs
- **Capability**: user-auth
- **Capa**: application
- **Dependencias**: T-002
- **Archivos**:
  - `api/src/application/auth/ports/auth-port.ts`
  - `api/src/application/auth/ports/password-hasher.ts`
  - `api/src/application/auth/dtos/register-user.dto.ts`
  - `api/src/application/auth/dtos/login.dto.ts`
  - `api/src/application/auth/dtos/auth-response.dto.ts`
  - `api/src/application/auth/dtos/user-profile.dto.ts`
- **Criterios**:
  - [x] AuthPort con `sign(payload): string` y `verify(token): TokenPayload`
  - [x] PasswordHasher con `hash(plain): string` y `compare(plain, hash): boolean`
  - [x] DTOs definidos con tipos estrictos, sin decorators
- **LOC**: ~100

### T-005: Auth use cases
- **Capability**: user-auth
- **Capa**: application
- **Dependencias**: T-004
- **Archivos**:
  - `api/src/application/auth/use-cases/register-user.use-case.ts`
  - `api/src/application/auth/use-cases/login.use-case.ts`
  - `api/src/application/auth/use-cases/get-current-user.use-case.ts`
  - `api/src/application/auth/use-cases/refresh-token.use-case.ts`
- **Criterios**:
  - [x] RegisterUser: valida VOs, hashea password, emite evento, retorna UserProfileDTO
  - [x] Login: busca por email, compara password, firma JWT, guarda refresh token
  - [x] GetCurrentUser: retorna perfil desde userId en token
  - [x] RefreshToken: valida refresh token, rota si corresponde
  - [x] Todos retornan `Result<T, DomainError>`
- **LOC**: ~160

### T-006: Messaging DTOs + use cases
- **Capability**: messaging-core
- **Capa**: application
- **Dependencias**: T-003, T-005
- **Archivos**:
  - `api/src/application/messaging/dtos/send-message.dto.ts`
  - `api/src/application/messaging/dtos/message-response.dto.ts`
  - `api/src/application/messaging/dtos/inbox-query.dto.ts`
  - `api/src/application/messaging/dtos/reply-message.dto.ts`
  - `api/src/application/messaging/use-cases/send-message.use-case.ts`
  - `api/src/application/messaging/use-cases/get-inbox.use-case.ts`
  - `api/src/application/messaging/use-cases/get-sent.use-case.ts`
  - `api/src/application/messaging/use-cases/get-message.use-case.ts`
  - `api/src/application/messaging/use-cases/mark-as-read.use-case.ts`
  - `api/src/application/messaging/use-cases/reply-to-message.use-case.ts`
  - `api/src/application/messaging/use-cases/get-thread.use-case.ts`
- **Criterios**:
  - [x] SendMessage: valida VOs, verifica destinatario existe, crea Message + MessageRecipient, emite evento
  - [x] GetInbox/GetSent: paginados, filtro por status, solo mensajes del usuario
  - [x] GetMessageDetail: sender → full detail, recipient → detail, otros → 403
  - [x] MarkAsRead: idempotente, solo recipients pueden marcar
  - [x] ReplyToMessage: crea respuesta con parentMessageId, hereda asunto con "Re: " prefijo
  - [x] GetThread: devuelve cadena de mensajes ordenados por sentAt ASC
- **LOC**: ~360

---

## Phase 3: Infrastructure & Schema (Work Units 2 & 3)

### T-007: Prisma schema + PrismaService + env config
- **Capability**: infra
- **Capa**: infrastructure
- **Dependencias**: ninguna (paralelo a Phase 1)
- **Archivos**:
  - `api/prisma/schema.prisma`
  - `api/src/infrastructure/persistence/prisma/prisma.service.ts`
  - `api/src/infrastructure/config/env.config.ts`
- **Criterios**:
  - [x] Schema con modelos User, RefreshToken, Message, MessageRecipient, ConversationThread
  - [x] Enums Role y MessageStatus
  - [x] Índices en senderId, recipientId+status, threadId
  - [x] PrismaService como singleton (OnModuleInit/OnModuleDestroy)
  - [x] EnvConfig con variables: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS
  - [ ] Migración inicial generada con `prisma migrate dev`
- **LOC**: ~120

### T-008: Auth infrastructure — JWT, bcrypt, guards
- **Capability**: user-auth
- **Capa**: infrastructure
- **Dependencias**: T-004, T-007
- **Archivos**:
  - `api/src/infrastructure/auth/jwt-auth-port.ts`
  - `api/src/infrastructure/auth/bcrypt-password-hasher.ts`
  - `api/src/infrastructure/auth/guards/auth.guard.ts`
  - `api/src/infrastructure/auth/guards/roles.guard.ts`
  - `api/src/infrastructure/auth/decorators/current-user.decorator.ts`
  - `api/src/infrastructure/auth/decorators/roles.decorator.ts`
- **Criterios**:
  - [x] JwtAuthPort implementa AuthPort: sign con expiresIn, verify con secret
  - [x] BcryptPasswordHasher implementa PasswordHasher: hash con rounds configurable
  - [x] AuthGuard extrae token de Authorization: Bearer, llama authPort.verify(), inyecta req.user
  - [x] RolesGuard lee req.user.role y chequea contra required roles
  - [ ] Tests de JWT sign/verify roundtrip, bcrypt hash/compare
- **LOC**: ~140

### T-009: User persistence — mapper + repository
- **Capability**: user-auth
- **Capa**: infrastructure
- **Dependencias**: T-002, T-007
- **Archivos**:
  - `api/src/infrastructure/persistence/prisma/mappers/user-mapper.ts`
  - `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts`
- **Criterios**:
  - [x] UserMapper.toDomain: Prisma User → domain User (usa reconstruct())
  - [x] UserMapper.toPrisma: domain User → Prisma create input
  - [x] PrismaUserRepository implementa UserRepository port
  - [x] `findByEmail` case-insensitive (vía @unique en schema)
  - [ ] Tests con Testcontainers o mock de PrismaClient
- **LOC**: ~100

### T-010: Message persistence — mapper + repository
- **Capability**: messaging-core
- **Capa**: infrastructure
- **Dependencias**: T-003, T-007
- **Archivos**:
  - `api/src/infrastructure/persistence/prisma/mappers/message-mapper.ts`
  - `api/src/infrastructure/persistence/prisma/repositories/prisma-message.repository.ts`
- **Criterios**:
  - [x] MessageMapper.toDomain: Prisma Message + recipients → domain Message
  - [x] MessageMapper.toPrisma: domain Message → Prisma create (incluye recipients)
  - [x] PrismaMessageRepository implementa MessageRepository port
  - [x] `findByRecipient` paginado + filtro por status
  - [x] `saveRecipient` actualiza status + readAt
  - [x] `findThread`: cadena de parentMessageId
- **LOC**: ~150

### T-011: Seed data
- **Capability**: infra
- **Capa**: infrastructure
- **Dependencias**: T-007, T-009, T-010
- **Archivos**:
  - `api/src/infrastructure/persistence/seed.ts`
- **Criterios**:
  - [x] Crea usuarios de prueba (Admin, Supervisor, Técnico, Usuario)
  - [x] Crea mensajes de ejemplo entre usuarios (incluyendo replies y thread)
  - [x] Script ejecutable via `npx ts-node seed.ts` o comando NestJS
- **LOC**: ~100

---

## Phase 4: Presentation — API (Work Units 2 & 3)

### T-012: Shared presentation — ExceptionFilter, ResponseInterceptor, main.ts
- **Capability**: infra
- **Capa**: presentation
- **Dependencias**: T-001, T-007
- **Archivos**:
  - `api/src/presentation/shared/filters/exception.filter.ts`
  - `api/src/presentation/shared/interceptors/response.interceptor.ts`
  - `api/src/main.ts`
- **Criterios**:
  - [x] ExceptionFilter: atrapa DomainError → mapea a HTTP (NotFound→404, NotAuthorized→403, Validation→400, Conflict→409, generic→500)
  - [x] ResponseInterceptor: envuelve responses exitosos en `{ data: ... }` o `{ data, total, page, pageSize }`
  - [x] main.ts: setGlobalPrefix('v1'), CORS configurado para web/, hooks filters/interceptors
- **LOC**: ~80

### T-013: AuthController + AuthModule
- **Capability**: user-auth
- **Capa**: presentation
- **Dependencias**: T-005, T-008, T-009, T-012
- **Archivos**:
  - `api/src/presentation/auth/auth.controller.ts`
  - `api/src/presentation/auth/auth.module.ts`
  - `api/src/presentation/auth/dto/register.request.ts`
  - `api/src/presentation/auth/dto/login.request.ts`
- **Criterios**:
  - [x] POST /v1/auth/register → 201 con UserProfileDTO
  - [x] POST /v1/auth/login → 200 con accessToken + Set-Cookie refreshToken (httpOnly, secure, sameSite=strict)
  - [x] POST /v1/auth/refresh → 200 con nuevo accessToken
  - [x] GET /v1/auth/me → 200 con perfil (AuthGuard aplicado)
  - [x] AuthModule declara providers: use cases, ports, repos, adapters
  - [x] Request DTOs con interfaces (sin decorators — validación con zod en controller)
- **LOC**: ~100

### T-014: MessagingController + MessagingModule
- **Capability**: messaging-core
- **Capa**: presentation
- **Dependencias**: T-006, T-008, T-010, T-012
- **Archivos**:
  - `api/src/presentation/messaging/messaging.controller.ts`
  - `api/src/presentation/messaging/messaging.module.ts`
  - `api/src/presentation/messaging/dto/send-message.request.ts`
  - `api/src/presentation/messaging/dto/pagination.query.ts`
- **Criterios**:
  - [x] POST /v1/messages → 201 con MessageResponse (AuthGuard)
  - [x] GET /v1/messages/inbox → 200 paginado con filtro status (AuthGuard)
  - [x] GET /v1/messages/sent → 200 paginado (AuthGuard)
  - [x] GET /v1/messages/:id → 200 o 403 (AuthGuard)
  - [x] PATCH /v1/messages/:id/read → 200 (AuthGuard)
  - [x] POST /v1/messages/:id/reply → 201 con parentMessageId (AuthGuard)
  - [x] GET /v1/messages/:id/thread → 200 con thread + mensajes ordenados (AuthGuard)
  - [x] Request DTOs con interfaces
  - [x] AuthGuard en todos los endpoints
- **LOC**: ~180

---

## Phase 5: Web Frontend (Work Unit 4)

### T-015: Web foundation — API client, AuthContext, ProtectedRoute, Layout
- **Capability**: infra
- **Capa**: web
- **Dependencias**: (API running)
- **Archivos**:
  - `web/src/api/client.ts`
  - `web/src/contexts/auth.context.tsx`
  - `web/src/components/protected-route.tsx`
  - `web/src/components/layout.tsx`
  - `web/src/App.tsx`
- **Criterios**:
- [x] API client con axios, manejo de tokens, refresh automático
- [x] AuthContext: login, logout, user state, token management (in-memory)
- [x] ProtectedRoute: redirect a login si no autenticado
- [x] Layout: header + sidebar + main content area
- [x] App.tsx con router (React Router v7)
- **LOC**: ~160

### T-016: Web Login page
- **Capability**: user-auth
- **Capa**: web
- **Dependencias**: T-015
- **Archivos**:
  - `web/src/pages/login.page.tsx`
- **Criterios**:
- [x] Formulario con email + password
- [x] Submit → POST /auth/login → redirige a inbox
- [x] Muestra errores de validación y 401
- [x] Link a registro (placeholder — no implementado)
- **LOC**: ~60

### T-017: Web Inbox, Compose, and MessageDetail pages
- **Capability**: messaging-core
- **Capa**: web
- **Dependencias**: T-015
- **Archivos**:
  - `web/src/pages/inbox.page.tsx`
  - `web/src/pages/compose.page.tsx`
  - `web/src/pages/message-detail.page.tsx`
- **Criterios**:
- [x] Inbox: lista paginada de mensajes recibidos, indicador leído/no leído, filtro por status (tabs)
- [x] Sent: lista paginada de mensajes enviados
- [x] Compose: formulario con destinatario, asunto, cuerpo. Submit → redirect a enviados
- [x] MessageDetail: muestra remitente, destinatarios, asunto, cuerpo, fecha. Auto mark-as-read al abrir. Reply inline. Hilo de conversación.
- **LOC**: ~180

---

## Phase 6: Tests (All Work Units)

### T-018: Domain unit tests
- **Capability**: infra
- **Capa**: domain
- **Dependencias**: T-001, T-002, T-003
- **Archivos**:
  - `packages/domain/src/__tests__/value-objects.test.ts`
  - `packages/domain/src/__tests__/result.test.ts`
  - `packages/domain/src/__tests__/user.test.ts`
  - `packages/domain/src/__tests__/message.test.ts`
  - `packages/domain/src/__tests__/message-recipient.test.ts`
- **Criterios**:
  - [x] Todos los VOs: validación (casos válidos e inválidos), equals, get
  - [x] Result: ok/err, unwrap, unwrapOr, map
  - [x] User: create (rol por defecto Usuario), password validation
  - [x] Message: create con recipients, markRead en MessageRecipient
- **LOC**: ~180

### T-019: Application use case tests (auth + messaging)
- **Capability**: user-auth + messaging-core
- **Capa**: application
- **Dependencias**: T-005, T-006
- **Archivos**:
  - `api/src/__tests__/auth/register.test.ts`
  - `api/src/__tests__/auth/login.test.ts`
  - `api/src/__tests__/auth/auth-flow.test.ts`
  - `api/src/__tests__/messaging/send-message.test.ts`
  - `api/src/__tests__/messaging/inbox.test.ts`
  - `api/src/__tests__/messaging/mark-read.test.ts`
  - `api/src/__tests__/messaging/reply.test.ts`
- **Criterios**:
  - [x] RegisterUser: éxito, email duplicado → error, password corto → error
  - [x] Login: éxito, credenciales inválidas → 401 (mismo msg para email no existe)
  - [x] Auth flow: register → login → access → profile → refresh
  - [x] SendMessage: 1 recipient, multiple recipients, empty → error, nonexistent → error
  - [x] GetInbox: paginación, filtro status, sin mensajes → []
  - [x] MarkAsRead: idempotente, no recipient → 403, delivered→read
  - [x] Reply: parentMessageId correcto, error si no hay acceso al parent
  - [x] GetThread: cadena de mensajes ordenados, acceso denegado a no participantes
- **LOC**: ~350

### T-020: Infrastructure + Presentation + E2E tests
- **Capability**: infra
- **Capa**: infrastructure + presentation
- **Dependencias**: T-008, T-009, T-010, T-013, T-014
- **Archivos**:
  - `api/src/infrastructure/auth/__tests__/jwt-auth-port.test.ts`
  - `api/src/infrastructure/auth/__tests__/auth.guard.test.ts`
  - `api/src/presentation/auth/__tests__/auth.controller.test.ts`
  - `api/src/presentation/messaging/__tests__/messaging.controller.test.ts`
  - `api/test/e2e/auth-flow.e2e-spec.ts`
  - `api/src/__tests__/e2e/messaging-flow.test.ts`
- **Criterios**:
  - [ ] JWT: sign/verify roundtrip, token inválido → throw
  - [ ] AuthGuard: sin token → 401, token válido → llama controller
  - [ ] AuthController: status codes correctos para cada escenario
  - [ ] MessagingController: status codes correctos, 403 si no autorizado
  - [x] E2E: login → send → receive inbox → view detail → mark as read → reply → stranger
- **LOC**: ~300

---

## Implementation Order (Bottom-Up)

```
Phase 1 ───────────────┐
  T-001, T-002, T-003  │
                        ├── Phase 2 ─────────┐
                        │   T-004, T-005     │
                        │   T-006             │
                        │                     ├── Phase 3 ──────┐
                        │                     │   T-007, T-008  │
                        │                     │   T-009, T-010  │
                        │                     │   T-011          │
                        │                     │                   ├── Phase 4
                        │                     │                   │   T-012, T-013
                        │                     │                   │   T-014
                        │                     │                   │
                        │                     │                   ├── Phase 5
                        │                     │                   │   T-015, T-016
                        │                     │                   │   T-017
                        │                     │                   │
                        │                     │                   └── Phase 6
                        │                     │                       T-018 → T-020
Phase 7: Tests ─────────┘                     │
  T-018, T-019, T-020 ────────────────────────┘
```

**En cada PR**: los tests quedan con su código. T-018 con WU1, T-019 con WU2/WU3, T-020 con WU3/WU4.

---

## Work Unit → Task Mapping

| PR | Tasks | Focus |
|----|-------|-------|
| PR 1 → main | T-001, T-002, T-003, T-018 | Domain standalone (~630 LOC) |
| PR 2 → main | T-004, T-005, T-007, T-008, T-009, T-012, T-013, T-019 (auth) | Auth API + shared infra (~810 LOC) |
| PR 3 → main | T-006, T-010, T-011, T-014, T-019 (msg), T-020 | Messaging API + tests (~820 LOC) ✅ |
| PR 4 → main | T-015, T-016, T-017 | Web frontend (~400 LOC) |
